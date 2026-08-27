import type { Card, Clue, GameState, Team } from "./types";

function pickRandom<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function createGame(wordPool: string[]): GameState {
  const words = pickRandom(wordPool, 25);

  const startingTeam: Team = Math.random() < 0.5 ? "red" : "blue";
  const otherTeam: Team = startingTeam === "red" ? "blue" : "red";

  const teamAssignments: Card["team"][] = [
    ...Array(9).fill(startingTeam),
    ...Array(8).fill(otherTeam),
    ...Array(7).fill("neutral"),
    "assassin",
  ].sort(() => Math.random() - 0.5);

  const cards: Card[] = words.map((word, index) => ({
    word,
    team: teamAssignments[index],
    revealed: false,
  }));

  return {
    cards,
    turn: startingTeam,
    winner: null,
    players: [],
    clueHistory: [],
  };
}

export function addClue(
  state: GameState,
  clue: Omit<Clue, "id" | "timestamp">
): GameState {
  const newClue: Clue = {
    ...clue,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  return {
    ...state,
    clueHistory: [...state.clueHistory, newClue],
  };
}

export function revealCard(state: GameState, index: number): GameState {
  // TODO: implement in next iteration — mark cards[index] as revealed, and if it
  // belongs to the assassin or the other team, end the current player's turn.
  return state;
}

export function revealMultiple(state: GameState, indices: number[]): GameState {
  if (indices.length === 0) return state;

  const indexSet = new Set(indices);
  const cards = state.cards.map((card, index) =>
    indexSet.has(index) ? { ...card, revealed: true } : card
  );

  return {
    ...state,
    cards,
  };
}

export function checkWinCondition(state: GameState): Team | null {
  // Assassin reveal should also end the game (handing win to the other team) —
  // not yet implemented, add this branch later.

  const redCards = state.cards.filter((card) => card.team === "red");
  const blueCards = state.cards.filter((card) => card.team === "blue");

  const redRevealed = redCards.filter((card) => card.revealed).length;
  const blueRevealed = blueCards.filter((card) => card.revealed).length;

  if (redRevealed === redCards.length) return "red";
  if (blueRevealed === blueCards.length) return "blue";

  return state.winner;
}

export function passTurn(state: GameState): GameState {
  // TODO: implement in next iteration — flip state.turn to the other team.
  return state;
}
