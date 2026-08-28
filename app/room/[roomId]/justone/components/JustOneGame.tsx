"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  applyAction,
  createJustOneState,
  getSurvivingClues,
  mergeState,
  startRound,
  type JustOneAction,
  type JustOneClue,
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

// Cosmetic rotation for the coloured clue cards — index-based, not tied to
// who wrote which clue, so the guesser gets no identity hint from color.
const CARD_COLORS = [
  { bg: "#F1FDFD", border: "#5FE8EC" },
  { bg: "#F5F1FE", border: "#8B5CF6" },
  { bg: "#FEF1F7", border: "#EC4899" },
  { bg: "#F1FEFA", border: "#10B981" },
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
  const canStartRound = game.players.length >= 2;
  const nextUpName =
    game.players.length > 0
      ? game.players[game.nextActiveIndex % game.players.length].name
      : null;

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
    if (!clueDraft.trim()) {
      setError("Write a one-word clue first.");
      return;
    }
    dispatch({ type: "clue", playerName: playerName!, word: clueDraft.trim() });
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
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8">
        <header className="text-center">
          <div className="flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-wide text-[#65707B]">
            <Link href="/lobby" className="normal-case underline underline-offset-4">
              Back to the overview
            </Link>
            <span>Room {roomId}</span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold">Just One</h1>
        </header>

        <section className="w-full rounded-2xl border-2 border-[#D1DCE5] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-[#65707B]">Players</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {game.players.map((p) => (
              <li key={p.id} className="font-bold">
                {p.name === playerName ? `You: ${p.name}` : p.name}
                {round?.activePlayerName === p.name && (
                  <span className="ml-1 font-normal text-[#8B5CF6]">(guessing)</span>
                )}
              </li>
            ))}
          </ul>
          {!canStartRound && (
            <p className="mt-2 text-sm text-[#65707B]">
              Waiting for at least one more player to join before a round can start.
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
                <ClueCards clues={survivingClues} />
              </>
            )}
            <p className="mt-6 font-bold">
              {nextUpName ? `Next up: ${nextUpName === playerName ? "You" : nextUpName}` : "Waiting for players"}
            </p>
            <ActionButton onClick={handleStartRound} disabled={!canStartRound}>
              {round ? "Start next round" : "Start round"}
            </ActionButton>
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
                <h2 className="font-display text-2xl font-bold">Write your clue</h2>
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
                      One word only
                      <input
                        value={clueDraft}
                        onChange={(event) => setClueDraft(event.target.value)}
                        className="rounded-lg border-2 border-[#D1DCE5] bg-white px-4 py-3 font-normal outline-none focus:border-[#1F2B38]"
                      />
                    </label>
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
            <ClueCards clues={survivingClues} />
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
                    onChange={(event) => setGuessDraft(event.target.value)}
                    className="rounded-lg border-2 border-[#D1DCE5] bg-white px-4 py-3 font-normal outline-none focus:border-[#1F2B38]"
                  />
                </label>
                <ActionButton onClick={handleSubmitGuess}>Confirm guess</ActionButton>
              </>
            ) : (
              <p className="mt-6 font-bold">Waiting for their guess...</p>
            )}
          </section>
        )}

        {error && <p className="font-bold text-[#EC4899]">{error}</p>}

        {game.history.length > 0 && (
          <section className="w-full">
            <p className="text-sm font-bold uppercase tracking-wide text-[#65707B]">
              Round history
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {[...game.history].reverse().map((entry, index) => (
                <li key={index}>
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

function ClueCards({ clues }: { clues: JustOneClue[] }) {
  if (clues.length === 0) {
    return <p className="mt-6 italic text-[#65707B]">No clues survived — all were duplicates.</p>;
  }
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      {clues.map((clue, index) => {
        const color = CARD_COLORS[index % CARD_COLORS.length];
        return (
          <div
            key={`${clue.playerName}-${index}`}
            className="rounded-lg border-2 px-5 py-3 text-lg font-bold shadow-sm"
            style={{ backgroundColor: color.bg, borderColor: color.border }}
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
