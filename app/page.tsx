"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NameEntryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState(false);

  function handleContinue() {
    if (!name.trim()) {
      setError(true);
      return;
    }

    // sessionStorage (not localStorage) is intentional: each browser tab keeps
    // its own player name, so multiple tabs on one machine act as multiple people.
    sessionStorage.setItem("reGamePlayerName", name.trim());
    router.push("/lobby");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 text-zinc-900">
      <h1 className="text-3xl font-semibold">Welcome to re-game</h1>
      <p className="text-sm text-zinc-500">Enter your name to join a room.</p>
      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(false);
        }}
        placeholder="Your name"
        className="rounded border border-zinc-300 px-4 py-2"
      />
      {error && (
        <p className="text-sm text-red-500">Enter a name to continue.</p>
      )}
      <button
        onClick={handleContinue}
        className="rounded bg-black px-5 py-3 text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black"
      >
        Go to Lobby
      </button>
    </main>
  );
}