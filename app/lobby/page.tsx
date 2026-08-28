"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import codenamesImage from "./codenames.png";
import simpleLeaderboard from "./simple-leaderboard.png";
import twoTruthsImage from "./twotruths.png";

type GameRoute = "codenames" | "twotruths1lie" | "justone";

// Persisted alongside the room id so "Join current game" can route to the
// right game — previously this only ever assumed Codenames.
type CurrentRoom = { roomId: string; route: GameRoute };

// Tiles in this set show a hover overlay with separate "Play" / "Join
// current game" actions instead of creating a fresh room on every click —
// that's what makes joining an in-progress room possible.
const JOINABLE_ROUTES: GameRoute[] = ["codenames", "justone"];

const placeholderCards: {
  title: string;
  playLabel?: string;
  tone: string;
  image?: string;
  route?: GameRoute;
}[] = [
  {
    title: "rebuy Codenames",
    playLabel: "Play Codenames",
    tone: "bg-zinc-200",
    image: codenamesImage.src,
    route: "codenames",
  },
  {
    title: "Two truths one lie",
    tone: "bg-zinc-300",
    image: twoTruthsImage.src,
    route: "twotruths1lie",
  },
  {
    title: "Just One",
    playLabel: "Play Just One",
    tone: "bg-zinc-200",
    route: "justone",
  },
];

export default function LobbyPage() {
  const router = useRouter();

  // Lazy initializer (guarded for SSR, where window is undefined) instead of
  // reading localStorage + setState in an effect — consistent with how
  // playerName is read in CodenamesGame.tsx, and avoids a set-state-in-effect
  // cascading render.
  const [currentRoom] = useState<CurrentRoom | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("reGameCurrentRoom");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as CurrentRoom;
    } catch {
      // Pre-existing plain-roomId value from before this key held JSON —
      // there's no way to recover which game it was for, so treat it as no
      // current room rather than crashing the lobby.
      return null;
    }
  });

  function playNewRoom(route: GameRoute) {
    const roomId = crypto.randomUUID();
    // Unlike the player name (sessionStorage, per-tab), the current room is
    // intentionally in localStorage: it needs to be shared across tabs in
    // the same browser, which is what lets a second tab join instead of
    // manually pasting a URL.
    localStorage.setItem("reGameCurrentRoom", JSON.stringify({ roomId, route }));
    router.push(`/room/${roomId}/${route}`);
  }

  function handleJoinCurrentGame() {
    if (!currentRoom) return;
    router.push(`/room/${currentRoom.roomId}/${currentRoom.route}`);
  }

  return (
    <main className="min-h-screen bg-[#F5F7F9] px-6 py-16 font-sans text-[#1F2B38]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10">
        <header className="text-center">
          <h1 className="mt-4 font-display text-4xl font-bold text-[#1F2B38] sm:text-5xl">
            Pick a game to play
          </h1>
        </header>

        <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {placeholderCards.map(({ title, playLabel, tone, image, route }) => {
            const isJoinable = Boolean(route && JOINABLE_ROUTES.includes(route));
            const isInstantPlay = Boolean(route) && !isJoinable;

            return (
              <div
                key={title}
                className={`flex flex-col items-center gap-3 ${isInstantPlay ? "cursor-pointer" : ""}`}
                onClick={isInstantPlay ? () => playNewRoom(route!) : undefined}
                onKeyDown={
                  isInstantPlay
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          playNewRoom(route!);
                        }
                      }
                    : undefined
                }
                role={isInstantPlay ? "link" : undefined}
                tabIndex={isInstantPlay ? 0 : undefined}
              >
                <div
                  className={`group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-[#D1DCE5] ${tone} shadow-sm`}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={title}
                      className={`h-full w-full object-cover transition-opacity ${route ? "group-hover:opacity-70" : ""}`}
                    />
                  ) : (
                    <span className="text-sm font-medium text-[#65707B]">Image</span>
                  )}
                  {isJoinable && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1F2B38]/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        onClick={() => playNewRoom(route!)}
                        className="rounded-lg bg-[#8B5CF6] px-5 py-3 font-bold text-white transition hover:bg-[#AE8EF9]"
                      >
                        {playLabel ?? title}
                      </button>
                      {currentRoom?.route === route && (
                        <button
                          onClick={handleJoinCurrentGame}
                          className="rounded-lg border-2 border-[#5FE8EC] bg-white px-5 py-3 font-bold text-[#1F2B38] transition hover:bg-[#C0F6F7]"
                        >
                          Join current game
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold text-[#1F2B38]">{title}</p>
              </div>
            );
          })}
        </section>

        <div className="flex w-full justify-center">
          <Link href="/scoreboard" className="block w-full max-w-2xl">
            <img
              src={simpleLeaderboard.src}
              alt="Simple leaderboard preview"
              className="w-full rounded-2xl"
            />
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Link href="/scoreboard" className="font-bold text-[#EC4899] underline decoration-[#F280B8] underline-offset-4">
            View Scoreboard
          </Link>
        </div>
      </div>
    </main>
  );
}
