"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { GameState } from "./types";

// TODO: implement in next iteration — this will open a BroadcastChannel scoped to
// `re-game:${roomId}`, broadcast state changes on every setState call, and listen
// for updates from other tabs in the same room so every tab shares one GameState.
// The signature below is the seam: swapping the useState body for the
// BroadcastChannel-backed version should not require changes at call sites.
export function useSync(
  roomId: string,
  initialState: GameState
): [GameState, Dispatch<SetStateAction<GameState>>] {
  return useState<GameState>(initialState);
}
