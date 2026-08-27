"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LobbyPage() {
  const router = useRouter();

  function handlePlayCodenames() {
    const roomId = crypto.randomUUID();
    router.push(`/room/${roomId}/codenames`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Screen 1: Lobby</h1>
      <p className="text-sm text-zinc-500">
        Welcome + scoreboard preview + game picker.
      </p>
      <button
        onClick={handlePlayCodenames}
        className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
      >
        Play Codenames
      </button>
      <Link href="/scoreboard" className="underline">
        View Scoreboard
      </Link>
    </main>
  );
}