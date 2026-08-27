"use client";

import Link from "next/link";

export default function NameEntryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 text-zinc-900">
      <h1 className="text-3xl font-semibold">Welcome to re-game</h1>
      <p className="text-sm text-zinc-500">Ready to jump into the lobby?</p>
      <Link
        href="/lobby"
        className="rounded bg-black px-5 py-3 text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black"
      >
        Go to Lobby
      </Link>
    </main>
  );
}