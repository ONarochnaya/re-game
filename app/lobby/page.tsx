"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import codenamesImage from "./codenames.png";
import simpleLeaderboard from "./simple-leaderboard.png";

const placeholderCards = [
  { title: "rebuy Codenames", tone: "bg-zinc-200", image: codenamesImage.src },
  { title: "Placeholder 2", tone: "bg-zinc-300" },
  { title: "Placeholder 3", tone: "bg-zinc-200" },
  { title: "Placeholder 4", tone: "bg-zinc-300" },
  { title: "Placeholder 5", tone: "bg-zinc-200" },
];

export default function LobbyPage() {
  const router = useRouter();

  // Lazy initializer (guarded for SSR, where window is undefined) instead of
  // reading localStorage + setState in an effect — consistent with how
  // playerName is read in CodenamesGame.tsx, and avoids a set-state-in-effect
  // cascading render.
  const [currentRoomId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("reGameCurrentRoom");
  });

  function handlePlayCodenames() {
    const roomId = crypto.randomUUID();
    // Unlike the player name (sessionStorage, per-tab), the room id is
    // intentionally in localStorage: it needs to be shared across tabs in the
    // same browser, which is what lets a second tab "join" instead of
    // manually pasting a URL.
    localStorage.setItem("reGameCurrentRoom", roomId);
    router.push(`/room/${roomId}/codenames`);
  }

  function handleJoinCurrentGame() {
    if (!currentRoomId) return;
    router.push(`/room/${currentRoomId}/codenames`);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10">
        <header className="text-center">
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Pick a game to play
          </h1>
        </header>

        <section className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {placeholderCards.map(({ title, tone, image }) => (
            <div
              key={title}
              className={`flex flex-col items-center gap-3 ${image ? "cursor-pointer" : ""}`}
              onClick={image ? handlePlayCodenames : undefined}
              onKeyDown={
                image
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handlePlayCodenames();
                      }
                    }
                  : undefined
              }
              role={image ? "link" : undefined}
              tabIndex={image ? 0 : undefined}
            >
              <div
                className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-300 ${tone} shadow-sm`}
              >
                {image ? (
                  <img
                    src={image}
                    alt="rebuy Codenames"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-zinc-600">Image</span>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-700">{title}</p>
            </div>
          ))}
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
          <button
            onClick={handlePlayCodenames}
            className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Play Codenames
          </button>
          {currentRoomId && (
            <button
              onClick={handleJoinCurrentGame}
              className="rounded border border-zinc-300 px-4 py-2 text-zinc-900"
            >
              Join current game
            </button>
          )}
          <Link href="/scoreboard" className="underline">
            View Scoreboard
          </Link>
        </div>
      </div>
    </main>
  );
}