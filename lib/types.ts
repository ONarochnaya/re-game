export type Team = "red" | "blue";

export type Role = "spymaster" | "operative";

export type Player = {
  name: string;
  id: string;
  team?: Team;
  role?: Role;
};

export type Card = {
  word: string;
  team: Team | "neutral" | "assassin";
  revealed: boolean;
};

export type Clue = {
  id: string;
  team: Team;
  playerName: string;
  word: string;
  number: number;
  timestamp: number;
};

export type GameState = {
  cards: Card[];
  turn: Team;
  winner: Team | null;
  players: Player[];
  clueHistory: Clue[];
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