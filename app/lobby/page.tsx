"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import codenamesImage from "./codenames.png";
import simpleLeaderboard from "./simple-leaderboard.png";
import twoTruthsImage from "./twotruths.png";

const placeholderCards = [
  {
    title: "rebuy Codenames",
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
    tone: "bg-zinc-200",
    route: "justone",
  },
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

  function handlePlayTwoTruths1Lie() {
    const roomId = crypto.randomUUID();
    localStorage.setItem("reGameCurrentRoom", roomId);
    router.push(`/room/${roomId}/twotruths1lie`);
  }

  function handlePlayJustOne() {
    const roomId = crypto.randomUUID();
    localStorage.setItem("reGameCurrentRoom", roomId);
    router.push(`/room/${roomId}/justone`);
  }

  function handleJoinCurrentGame() {
    if (!currentRoomId) return;
    router.push(`/room/${currentRoomId}/codenames`);
  }

  return (
    <main className="min-h-screen bg-[#F5F7F9] px-6 py-16 font-sans text-[#1F2B38]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10">
        <header className="text-center">
          <h1 className="mt-4 font-display text-4xl font-bold text-[#1F2B38] sm:text-5xl">
            Pick a game to play
          </h1>
        </header>

        <section className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {placeholderCards.map(({ title, tone, image, route }) => (
            <div
              key={title}
              className={`flex flex-col items-center gap-3 ${route ? "cursor-pointer" : ""}`}
              onClick={
                route === "codenames"
                  ? handlePlayCodenames
                  : route === "twotruths1lie"
                    ? handlePlayTwoTruths1Lie
                    : route === "justone"
                      ? handlePlayJustOne
                      : undefined
              }
              onKeyDown={
                route
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (route === "codenames") {
                          handlePlayCodenames();
                        } else if (route === "twotruths1lie") {
                          handlePlayTwoTruths1Lie();
                        } else if (route === "justone") {
                          handlePlayJustOne();
                        }
                      }
                    }
                  : undefined
              }
              role={route ? "link" : undefined}
              tabIndex={route ? 0 : undefined}
            >
              <div
                className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-[#D1DCE5] ${tone} shadow-sm`}
              >
                {image ? (
                  <img
                    src={image}
                    alt="rebuy Codenames"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-[#65707B]">Image</span>
                )}
              </div>
              <p className="text-sm font-bold text-[#1F2B38]">{title}</p>
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
            className="rounded-lg bg-[#8B5CF6] px-5 py-3 font-bold text-white transition hover:bg-[#AE8EF9]"
          >
            Play Codenames
          </button>
          {currentRoomId && (
            <button
              onClick={handleJoinCurrentGame}
              className="rounded-lg border-2 border-[#5FE8EC] px-5 py-3 font-bold text-[#1F2B38] transition hover:bg-[#C0F6F7]"
            >
              Join current game
            </button>
          )}
          <Link href="/scoreboard" className="font-bold text-[#EC4899] underline decoration-[#F280B8] underline-offset-4">
            View Scoreboard
          </Link>
        </div>
      </div>
    </main>
  );
}