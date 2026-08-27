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

// Future functions here: revealCard, checkWinCondition, passTurn — added in a later iteration.
