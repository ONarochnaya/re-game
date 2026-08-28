// Pure game rules for the Just One room — no React, no BroadcastChannel, no
// side effects, mirroring the separation lib/gameEngine.ts uses for Codenames.

export type JustOnePlayer = { id: string; name: string };

export type JustOneClue = { playerName: string; word: string };

export type JustOneRound = {
  roundNumber: number;
  activePlayerName: string;
  secretWord: string;
  // Snapshot of who owes a clue this round, taken when the round starts —
  // players who join mid-round aren't expected to submit one.
  clueGivers: string[];
  clues: JustOneClue[];
  phase: "collecting" | "revealed" | "complete";
  guess: string | null;
  result: "correct" | "incorrect" | null;
};

export type JustOneRoundSummary = {
  activePlayerName: string;
  secretWord: string;
  guess: string;
  result: "correct" | "incorrect";
  survivingClueCount: number;
};

export type JustOneState = {
  players: JustOnePlayer[];
  round: JustOneRound | null;
  nextActiveIndex: number;
  history: JustOneRoundSummary[];
};

export function createJustOneState(): JustOneState {
  return { players: [], round: null, nextActiveIndex: 0, history: [] };
}

export function addPlayer(state: JustOneState, player: JustOnePlayer): JustOneState {
  if (state.players.some((p) => p.name === player.name)) return state;
  return { ...state, players: [...state.players, player] };
}

// A clue survives only if no other clue-giver wrote the same word
// (case-insensitive) — a real duplicate hides both copies, not just one.
export function getSurvivingClues(round: JustOneRound): JustOneClue[] {
  const counts = new Map<string, number>();
  for (const clue of round.clues) {
    const key = clue.word.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return round.clues.filter((clue) => counts.get(clue.word.trim().toLowerCase()) === 1);
}

// House rule: a clue can't be the secret word itself, nor contain it or be
// contained within it (e.g. secret "MacBook" blocks clues "Mac" and "Book",
// and secret "Harry Potter" blocks "Harry" or "Potter") — case-insensitive.
export function isClueTooCloseToSecretWord(word: string, secretWord: string): boolean {
  const clue = word.trim().toLowerCase();
  const secret = secretWord.trim().toLowerCase();
  return clue.length > 0 && (secret.includes(clue) || clue.includes(secret));
}

// Just One needs at least one guesser and two clue-givers for the "remove
// duplicate clues" rule to mean anything — below that every clue would be
// unique by default and the game loses its core mechanic.
export const MIN_PLAYERS = 3;

// The game is capped at 13 rounds/words; score is how many were guessed
// correctly out of those 13.
export const MAX_ROUNDS = 13;

export function isGameOver(state: JustOneState): boolean {
  return state.history.length >= MAX_ROUNDS;
}

export function getScore(state: JustOneState): number {
  return state.history.filter((entry) => entry.result === "correct").length;
}

export function startRound(state: JustOneState, wordPool: string[]): JustOneState {
  if (state.players.length < MIN_PLAYERS) return state;
  if (state.round && state.round.phase !== "complete") return state;
  if (isGameOver(state)) return state;

  const activeIndex = state.nextActiveIndex % state.players.length;
  const activePlayerName = state.players[activeIndex].name;
  const secretWord = wordPool[Math.floor(Math.random() * wordPool.length)];
  const clueGivers = state.players
    .filter((p) => p.name !== activePlayerName)
    .map((p) => p.name);

  return {
    ...state,
    nextActiveIndex: activeIndex + 1,
    round: {
      roundNumber: state.history.length + 1,
      activePlayerName,
      secretWord,
      clueGivers,
      clues: [],
      phase: "collecting",
      guess: null,
      result: null,
    },
  };
}

export function submitClue(
  state: JustOneState,
  playerName: string,
  word: string
): JustOneState {
  const round = state.round;
  if (!round || round.phase !== "collecting") return state;
  if (playerName === round.activePlayerName) return state;
  if (!round.clueGivers.includes(playerName)) return state;

  const otherClues = round.clues.filter((c) => c.playerName !== playerName);
  const clues = [...otherClues, { playerName, word }];
  const allSubmitted = round.clueGivers.every((name) =>
    clues.some((c) => c.playerName === name)
  );

  return {
    ...state,
    round: { ...round, clues, phase: allSubmitted ? "revealed" : "collecting" },
  };
}

export function submitGuess(state: JustOneState, guess: string): JustOneState {
  const round = state.round;
  if (!round || round.phase !== "revealed") return state;

  const result: "correct" | "incorrect" =
    guess.trim().toLowerCase() === round.secretWord.trim().toLowerCase()
      ? "correct"
      : "incorrect";
  const completedRound: JustOneRound = { ...round, phase: "complete", guess, result };

  const summary: JustOneRoundSummary = {
    activePlayerName: round.activePlayerName,
    secretWord: round.secretWord,
    guess,
    result,
    survivingClueCount: getSurvivingClues(round).length,
  };

  return {
    ...state,
    round: completedRound,
    history: [...state.history, summary],
  };
}

// Sync model: every tab broadcasts small actions (not full-state snapshots)
// and applies them — its own and everyone else's — through this same
// reducer. Two tabs acting on different targets at nearly the same moment
// (two different players joining, two different clue-givers submitting)
// then both land instead of one silently overwriting the other, which is
// what a "broadcast the whole state" model would do. "roundStarted" carries
// the already-resolved round rather than re-deriving it, since deriving it
// involves Math.random() and every tab must agree on the same secret word.
export type JustOneAction =
  | { type: "join"; player: JustOnePlayer }
  | { type: "roundStarted"; round: JustOneRound; nextActiveIndex: number }
  | { type: "clue"; playerName: string; word: string }
  | { type: "guess"; guess: string };

export function applyAction(state: JustOneState, action: JustOneAction): JustOneState {
  switch (action.type) {
    case "join":
      return addPlayer(state, action.player);
    case "roundStarted":
      return { ...state, round: action.round, nextActiveIndex: action.nextActiveIndex };
    case "clue":
      return submitClue(state, action.playerName, action.word);
    case "guess":
      return submitGuess(state, action.guess);
  }
}

// Late joiners still need a one-time full snapshot to catch up on state that
// predates them (an in-progress round, history). A blind overwrite would
// erase whatever the receiving tab already knows locally (including, in the
// new tab's own case, the "join" it just applied to itself), so merge
// instead: union the player lists, and take the more-advanced side's
// round/history — "more advanced" meaning more completed rounds, since a
// brand-new tab's local round is always null at this point.
export function mergeState(local: JustOneState, incoming: JustOneState): JustOneState {
  const players = [...local.players];
  for (const player of incoming.players) {
    if (!players.some((p) => p.name === player.name)) players.push(player);
  }

  const incomingIsFurtherAlong = incoming.history.length >= local.history.length;

  return {
    players,
    round: incomingIsFurtherAlong ? incoming.round : local.round,
    nextActiveIndex: incomingIsFurtherAlong ? incoming.nextActiveIndex : local.nextActiveIndex,
    history: incomingIsFurtherAlong ? incoming.history : local.history,
  };
}
