"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { GameState } from "./types";

// BroadcastChannel-backed multi-tab sync: every tab in the same room opens a
// channel named `re-game:${roomId}`. Calling the returned setState updates this
// tab's state immediately and posts the resolved next state to the channel;
// other tabs pick it up via onmessage and update their own local state.
//
// Two message kinds share the channel: 'state' carries an actual GameState,
// 'requestState' is a late-joiner's ask to be caught up. On mount, a tab
// broadcasts 'requestState'; any other tab that already has state replies
// with its current state as a 'state' message. If nobody replies (this is
// the first tab in the room), the tab just keeps using initialState — no
// timeout/fallback needed since that's already the right behavior.
type SyncMessage =
  | { type: "state"; payload: GameState }
  | { type: "requestState" };

export function useSync(
  roomId: string,
  initialState: GameState
): [GameState, Dispatch<SetStateAction<GameState>>] {
  const [state, setState] = useState<GameState>(initialState);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef<GameState>(initialState);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      console.warn(
        "useSync: BroadcastChannel is not available in this browser — state will not sync across tabs."
      );
      return;
    }

    const channel = new BroadcastChannel(`re-game:${roomId}`);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data;

      if (message.type === "requestState") {
        // A late joiner is asking to be caught up — reply with what we
        // already have. This is not incoming state for us, so don't setState.
        channelRef.current?.postMessage({
          type: "state",
          payload: stateRef.current,
        } satisfies SyncMessage);
        return;
      }

      stateRef.current = message.payload;
      setState(message.payload);
    };

    channel.postMessage({ type: "requestState" } satisfies SyncMessage);

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [roomId]);

  const setSyncedState: Dispatch<SetStateAction<GameState>> = useCallback(
    (value) => {
      setState((prev) => {
        const next =
          typeof value === "function"
            ? (value as (prev: GameState) => GameState)(prev)
            : value;

        stateRef.current = next;
        channelRef.current?.postMessage({
          type: "state",
          payload: next,
        } satisfies SyncMessage);
        return next;
      });
    },
    []
  );

  return [state, setSyncedState];
}
