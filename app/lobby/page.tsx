"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const placeholderCards = [
  { title: "Placeholder 1", tone: "bg-zinc-200" },
  { title: "Placeholder 2", tone: "bg-zinc-300" },
  { title: "Placeholder 3", tone: "bg-zinc-200" },
  { title: "Placeholder 4", tone: "bg-zinc-300" },
  { title: "Placeholder 5", tone: "bg-zinc-200" },
];

export default function LobbyPage() {
  const router = useRouter();

  function handlePlayCodenames() {
    const roomId = crypto.randomUUID();
    router.push(`/room/${roomId}/codenames`);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10">
        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">
            Welcome
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to re-game
          </h1>
        </header>

        <section className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {placeholderCards.map(({ title, tone }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div
                className={`flex h-36 w-full items-center justify-center rounded-2xl border border-zinc-300 ${tone} shadow-sm`}
              >
                <span className="text-sm font-medium text-zinc-600">Image</span>
              </div>
              <p className="text-sm font-medium text-zinc-700">{title}</p>
            </div>
          ))}
        </section>

        <div className="flex w-full justify-center">
          <img
            src="/scoreboard-card.png"
            alt="Scoreboard card"
            className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-lg"
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handlePlayCodenames}
            className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Play Codenames
          </button>
          <Link href="/scoreboard" className="underline">
            View Scoreboard
          </Link>
        </div>
      </div>
    </main>
  );
}