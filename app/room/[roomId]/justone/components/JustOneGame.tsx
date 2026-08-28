"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  applyAction,
  createJustOneState,
  getScore,
  getSurvivingClues,
  isClueTooCloseToSecretWord,
  isGameOver,
  MAX_ROUNDS,
  mergeState,
  MIN_PLAYERS,
  startRound,
  type JustOneAction,
  type JustOneClue,
  type JustOnePlayer,
  type JustOneState,
} from "@/lib/justOneEngine";
import { JUST_ONE_WORDS } from "@/lib/justOneWords";

// Every tab broadcasts small actions and applies them — its own and everyone
// else's — through the same pure reducer (lib/justOneEngine.ts's
// applyAction), instead of broadcasting full-state snapshots that would
// silently overwrite whatever another tab did in the same instant (e.g. two
// different players joining, or two different clue-givers submitting within
// the same round-trip). 'state' is only used once, as a late joiner's
// catch-up snapshot, merged rather than blindly applied — see mergeState.
type SyncMessage =
  | { type: "state"; payload: JustOneState }
  | { type: "requestState" }
  | { type: "action"; action: JustOneAction };

function useJustOneSync(roomId: string): [JustOneState, (action: JustOneAction) => void] {
  const [state, setState] = useState<JustOneState>(createJustOneState);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef<JustOneState>(state);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(`re-game:justone:${roomId}`);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data;

      if (message.type === "requestState") {
        channelRef.current?.postMessage({
          type: "state",
          payload: stateRef.current,
        } satisfies SyncMessage);
        return;
      }

      if (message.type === "action") {
        setState((prev) => {
          const next = applyAction(prev, message.action);
          stateRef.current = next;
          return next;
        });
        return;
      }

      setState((prev) => {
        const next = mergeState(prev, message.payload);
        stateRef.current = next;
        return next;
      });
    };

    channel.postMessage({ type: "requestState" } satisfies SyncMessage);

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [roomId]);

  const dispatch = useCallback((action: JustOneAction) => {
    setState((prev) => {
      const next = applyAction(prev, action);
      stateRef.current = next;
      channelRef.current?.postMessage({ type: "action", action } satisfies SyncMessage);
      return next;
    });
  }, []);

  return [state, dispatch];
}

// Every player gets a fixed color from this set, assigned by join order —
// also used to color that player's clue cards, so the guesser sees who
// wrote each clue.
const PLAYER_COLORS = [
  "#95D239",
  "#C26ECA",
  "#23AAEC",
  "#F09BBA",
  "#F4D219",
  "#D8524F",
  "#EC8C1B",
];

function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

const CLUE_RULES = [
  {
    title: "Single Word Only",
    description:
      "You can only write one word. Numbers, acronyms, onomatopoeia, and special characters count as a single word if used correctly.",
  },
  {
    title: "No Duplicates",
    description:
      "Any identical clues, plurals, gender variations, or obvious misspellings written by multiple players are completely erased before the guesser sees them.",
  },
  {
    title: "No Secret Word Variations",
    description:
      "You cannot use the secret word itself, any part of it, or a different spelling form of it.",
  },
  {
    title: "No Word Families",
    description:
      'You cannot use a related word from the same word family (e.g., using "Princess" for the secret word "Prince").',
  },
  {
    title: "No Foreign Languages",
    description: "Translating the secret word into another language is forbidden.",
  },
  {
    title: "No Made-Up Words",
    description: "Invented or nonsense words are not allowed.",
  },
  {
    title: "No Sound-Alikes",
    description:
      'Words that sound identical or homophones (like "their" and "there") when the secret word is the other are invalid.',
  },
];

export default function JustOneGame({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [game, dispatch] = useJustOneSync(roomId);
  const [playerName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("reGamePlayerName");
  });
  const [clueDraft, setClueDraft] = useState("");
  const [guessDraft, setGuessDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!playerName) router.replace("/");
  }, [playerName, router]);

  useEffect(() => {
    if (!playerName) return;
    dispatch({ type: "join", player: { id: crypto.randomUUID(), name: playerName } });
  }, [playerName, dispatch]);

  const round = game.round;

  // Detect a freshly-completed correct guess during render (comparing
  // against the last round we've already seen finish), then use a separate
  // effect purely to auto-clear it after the animation's duration — the
  // clearing setState lives inside the timeout callback, not the effect
  // body itself, since only one round can ever be "complete" at a time.
  const [celebrateRoundNumber, setCelebrateRoundNumber] = useState<number | null>(null);
  const [lastSeenCompleteRound, setLastSeenCompleteRound] = useState<number | null>(null);
  if (round?.phase === "complete" && round.roundNumber !== lastSeenCompleteRound) {
    setLastSeenCompleteRound(round.roundNumber);
    if (round.result === "correct") setCelebrateRoundNumber(round.roundNumber);
  }
  useEffect(() => {
    if (celebrateRoundNumber === null) return;
    const timeout = setTimeout(() => setCelebrateRoundNumber(null), 2000);
    return () => clearTimeout(timeout);
  }, [celebrateRoundNumber]);

  // A new round means a new secret word — reset the per-round drafts by
  // comparing against the previous render instead of an effect, per React's
  // guidance for resetting state in response to a derived-value change.
  const [prevSecretWord, setPrevSecretWord] = useState(round?.secretWord);
  if (round?.secretWord !== prevSecretWord) {
    setPrevSecretWord(round?.secretWord);
    setClueDraft("");
    setGuessDraft("");
    setError("");
  }

  if (!playerName) return null;

  const isActive = round?.activePlayerName === playerName;
  const isClueGiver = round?.clueGivers.includes(playerName) ?? false;
  const myClue = round?.clues.find((c) => c.playerName === playerName);
  const survivingClues = round ? getSurvivingClues(round) : [];
  const struckClues = round ? round.clues.filter((c) => !survivingClues.includes(c)) : [];
  const gameOver = isGameOver(game);
  const canStartRound = game.players.length >= MIN_PLAYERS && !gameOver;
  const nextUpName =
    game.players.length > 0
      ? game.players[game.nextActiveIndex % game.players.length].name
      : null;
  // While a round is actually being played, show its own number; between
  // rounds (no round yet, or the last one just finished), preview the
  // upcoming round instead of the one that already completed.
  const displayRoundNumber =
    round && round.phase !== "complete"
      ? round.roundNumber
      : Math.min(game.history.length + 1, MAX_ROUNDS);

  function handleStartRound() {
    const resolved = startRound(game, JUST_ONE_WORDS);
    if (resolved === game || !resolved.round) return;
    dispatch({
      type: "roundStarted",
      round: resolved.round,
      nextActiveIndex: resolved.nextActiveIndex,
    });
  }

  function handleSubmitClue() {
    if (!round) return;

    const trimmed = clueDraft.trim();
    if (!trimmed) {
      setError("Write a one-word clue first.");
      return;
    }
    if (/\s/.test(trimmed)) {
      setError("Clues must be a single word.");
      return;
    }
    if (isClueTooCloseToSecretWord(trimmed, round.secretWord)) {
      setError("Clues can't contain or be part of the secret word.");
      return;
    }
    dispatch({ type: "clue", playerName: playerName!, word: trimmed });
  }

  function handleSubmitGuess() {
    if (!guessDraft.trim()) {
      setError("Enter your guess first.");
      return;
    }
    dispatch({ type: "guess", guess: guessDraft.trim() });
  }

  return (
    <main className="min-h-screen bg-[#F5F7F9] px-6 py-12 font-sans text-[#1F2B38]">
      {celebrateRoundNumber !== null && <CorrectGuessCelebration key={celebrateRoundNumber} />}
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8">
        <header className="text-center">
          <div className="flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-wide text-[#65707B]">
            <Link href="/lobby" className="normal-case underline underline-offset-4">
              Back to the overview
            </Link>
            <span>Room {roomId}</span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold">Just One</h1>
          <p className="mt-1 text-sm font-bold text-[#65707B]">
            Round {displayRoundNumber} of {MAX_ROUNDS}
          </p>
        </header>

        <section className="w-full rounded-2xl border-2 border-[#D1DCE5] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-[#65707B]">Players</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {game.players.map((p, index) => (
              <li key={p.id} className="flex items-center gap-2 font-bold">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getPlayerColor(index) }}
                />
                {p.name === playerName ? `You: ${p.name}` : p.name}
                {round?.activePlayerName === p.name && (
                  <span className="font-normal text-[#8B5CF6]">(guessing)</span>
                )}
              </li>
            ))}
          </ul>
          {!canStartRound && (
            <p className="mt-2 text-sm text-[#65707B]">
              Just One needs at least {MIN_PLAYERS} players — waiting for{" "}
              {MIN_PLAYERS - game.players.length} more to join before a round can start.
            </p>
          )}
        </section>

        {(!round || round.phase === "complete") && (
          <section className="w-full rounded-2xl border-2 border-[#D1DCE5] bg-white p-8 text-center shadow-sm">
            {round?.phase === "complete" && (
              <>
                <h2 className="font-display text-3xl font-bold">
                  {round.result === "correct" ? "Correct!" : "Not quite"}
                </h2>
                <p className="mt-3 text-lg">
                  The secret word was <strong>{round.secretWord}</strong>.{" "}
                  {round.activePlayerName === playerName ? "You" : round.activePlayerName} guessed
                  &quot;{round.guess}&quot;.
                </p>
                <ClueCards clues={survivingClues} players={game.players} />
              </>
            )}
            {gameOver ? (
              <>
                <h2 className="font-display text-3xl font-bold">Game over!</h2>
                <p className="mt-3 text-lg">
                  You scored <strong>{getScore(game)}</strong> out of {MAX_ROUNDS}.
                </p>
              </>
            ) : (
              <>
                {round && (
                  <p className="mt-6 font-bold">
                    {nextUpName ? `Next up: ${nextUpName === playerName ? "You" : nextUpName}` : "Waiting for players"}
                  </p>
                )}
                <ActionButton onClick={handleStartRound} disabled={!canStartRound}>
                  {round ? "Start next round" : "Start game"}
                </ActionButton>
              </>
            )}
          </section>
        )}

        {round && round.phase === "collecting" && (
          <>
            {isActive ? (
              <section className="w-full rounded-2xl border-2 border-[#D1BFFB] bg-[#F5F1FE] p-8 text-center shadow-sm">
                <h2 className="font-display text-2xl font-bold">You&apos;re guessing this round</h2>
                <p className="mt-2">
                  You have a secret word assigned that only the other players can see. Sit tight
                  while they write their clues.
                </p>
                <p className="mt-4 font-bold">
                  {round.clues.length} of {round.clueGivers.length} clues submitted
                </p>
              </section>
            ) : isClueGiver ? (
              <section className="w-full rounded-2xl border-2 border-[#C0F6F7] bg-[#F1FDFD] p-8 shadow-sm">
                <h2 className="font-display text-2xl font-bold">Write a one word clue</h2>
                <p className="mt-2">
                  Secret word: <strong>{round.secretWord}</strong>
                </p>
                {myClue ? (
                  <p className="mt-6 font-bold">
                    Clue submitted — waiting for the others ({round.clues.length} of{" "}
                    {round.clueGivers.length}).
                  </p>
                ) : (
                  <>
                    <label className="mt-6 flex flex-col gap-2 font-bold">
                      <input
                        value={clueDraft}
                        onChange={(event) => {
                          setClueDraft(event.target.value);
                          setError("");
                        }}
                        className="rounded-lg border-2 border-[#D1DCE5] bg-white px-4 py-3 font-normal outline-none focus:border-[#1F2B38]"
                      />
                    </label>
                    {error && <p className="mt-2 text-sm font-bold text-[#EC4899]">{error}</p>}
                    <ActionButton onClick={handleSubmitClue}>Submit clue</ActionButton>
                  </>
                )}
              </section>
            ) : (
              <section className="w-full rounded-2xl border-2 border-[#D1DCE5] bg-white p-8 text-center shadow-sm">
                <p>Round in progress — you&apos;ll join in for the next one.</p>
              </section>
            )}
          </>
        )}

        {round && round.phase === "revealed" && (
          <section className="w-full rounded-2xl border-2 border-[#D1BFFB] bg-[#F5F1FE] p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold">
              {isActive ? "Guess the secret word" : `${round.activePlayerName} is guessing`}
            </h2>
            {!isActive && (
              <p className="mt-2">
                Secret word: <strong>{round.secretWord}</strong>
              </p>
            )}
            <p className="mt-2">Clues, with any duplicates already removed:</p>
            <ClueCards clues={survivingClues} players={game.players} />
            {struckClues.length > 0 && !isActive && (
              <p className="mt-3 text-sm text-[#65707B]">
                {struckClues.length} duplicate clue{struckClues.length > 1 ? "s were" : " was"}{" "}
                struck out.
              </p>
            )}
            {isActive ? (
              <>
                <label className="mt-6 flex flex-col gap-2 font-bold">
                  Your guess
                  <input
                    value={guessDraft}
                    onChange={(event) => {
                      setGuessDraft(event.target.value);
                      setError("");
                    }}
                    className="rounded-lg border-2 border-[#D1DCE5] bg-white px-4 py-3 font-normal outline-none focus:border-[#1F2B38]"
                  />
                </label>
                {error && <p className="mt-2 text-sm font-bold text-[#EC4899]">{error}</p>}
                <ActionButton onClick={handleSubmitGuess}>Confirm guess</ActionButton>
              </>
            ) : (
              <p className="mt-6 font-bold">Waiting for their guess...</p>
            )}
          </section>
        )}

        <section className="w-full rounded-2xl border-2 border-[#D1DCE5] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-[#65707B]">
            Rules for clue-givers
          </p>
          <ol className="mt-2 flex flex-col gap-2 text-sm">
            {CLUE_RULES.map((rule) => (
              <li key={rule.title}>
                <span className="font-bold">{rule.title}:</span> {rule.description}
              </li>
            ))}
          </ol>
        </section>

        {game.history.length > 0 && (
          <section className="w-full">
            <p className="text-sm font-bold uppercase tracking-wide text-[#65707B]">
              Round history
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {[...game.history].reverse().map((entry, index) => (
                <li key={index}>
                  Round {game.history.length - index} —{" "}
                  <span className={entry.result === "correct" ? "text-[#10B981]" : "text-[#EC4899]"}>
                    {entry.result === "correct" ? "Correct" : "Missed"}
                  </span>{" "}
                  — {entry.activePlayerName} guessed &quot;{entry.guess}&quot; for{" "}
                  <strong>{entry.secretWord}</strong>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

// A burst of clapping-hands emoji that starts centered on screen, "blows up"
// with a quick scale, then falls away — see the just-one-clap keyframes in
// globals.css. Each hand gets its own random drift/rotation/delay so the
// burst reads as one celebration rather than identical clones.
function CorrectGuessCelebration() {
  // Lazy initializer, not a plain render-time computation — this component
  // is remounted fresh per celebration (keyed on roundNumber by the
  // caller), so this runs exactly once per burst, the same pattern already
  // used above for per-tab player ids.
  const [hands] = useState(() =>
    Array.from({ length: 7 }, (_, i) => ({
      id: i,
      delay: i * 0.05,
      drift: Math.random() * 220 - 110,
      rotate: Math.random() * 70 - 35,
    }))
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {hands.map((hand) => (
        <span
          key={hand.id}
          className="animate-just-one-clap absolute left-1/2 top-1/2 text-6xl"
          style={{
            animationDelay: `${hand.delay}s`,
            ["--drift" as string]: `${hand.drift}px`,
            ["--rotate" as string]: `${hand.rotate}deg`,
          }}
        >
          👏
        </span>
      ))}
    </div>
  );
}

function ClueCards({ clues, players }: { clues: JustOneClue[]; players: JustOnePlayer[] }) {
  if (clues.length === 0) {
    return <p className="mt-6 italic text-[#65707B]">No clues survived — all were duplicates.</p>;
  }
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      {clues.map((clue, index) => {
        const playerIndex = players.findIndex((p) => p.name === clue.playerName);
        const color = getPlayerColor(playerIndex === -1 ? index : playerIndex);
        return (
          <div
            key={`${clue.playerName}-${index}`}
            className="rounded-lg border-2 px-5 py-3 text-lg font-bold shadow-sm"
            style={{ backgroundColor: `${color}1A`, borderColor: color }}
          >
            {clue.word}
          </div>
        );
      })}
    </div>
  );
}

function ActionButton({
  children,
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-6 rounded-lg border-2 border-[#1F2B38] bg-[#D1DCE5] px-5 py-3 font-bold transition hover:bg-[#C0F6F7] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}
