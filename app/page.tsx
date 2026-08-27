"use client";

import Link from "next/link";

export default function NameEntryPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Screen 0: Name Entry</h1>
      <p className="text-sm text-zinc-500">Enter your name to join a room.</p>
      <Link
        href="/lobby"
        className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
      >
        Continue to Lobby
      </Link>
    </main>
  );
}