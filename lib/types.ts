export type Player = {
  name: string;
  id: string;
};

export type Card = {
  word: string;
  team: "red" | "blue" | "neutral" | "assassin";
  revealed: boolean;
};

export type GameState = {
  cards: Card[];
  turn: "red" | "blue";
  winner: "red" | "blue" | null;
};

export type ScoreboardEntry = {
  name: string;
  score: number;
  gamesPlayed: number;
};

export type Game = {
  id: string;
  name: string;
  imageUrl: string;
  comingSoon: boolean;
};