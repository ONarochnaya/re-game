import type { Card, GameState, Team } from "./types";

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
  };
}

export function revealCard(state: GameState, index: number): GameState {
  // TODO: implement in next iteration — mark cards[index] as revealed, and if it
  // belongs to the assassin or the other team, end the current player's turn.
  return state;
}

export function revealMultiple(state: GameState, indices: number[]): GameState {
  // TODO: implement in next iteration — apply revealCard for each index in order,
  // stopping early if a reveal ends the turn (wrong team or assassin), to support
  // the "reveal several guesses at once" flow from the real game rules.
  return state;
}

export function checkWinCondition(state: GameState): Team | null {
  // TODO: implement in next iteration — a team wins once all of its cards are
  // revealed; the assassin being revealed should hand the win to the other team.
  return state.winner;
}

export function passTurn(state: GameState): GameState {
  // TODO: implement in next iteration — flip state.turn to the other team.
  return state;
}
