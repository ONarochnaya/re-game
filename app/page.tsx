"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Cosmetic "team" flavor for the welcome screen only — unrelated to the
// red/blue Codenames Team type, which players pick in-game on Screen 3.
const TEAMS = [
  { name: "Forest", color: "#22c55e" },
  { name: "Mangrove", color: "#2dd4bf" },
  { name: "Ocean", color: "#06b6d4" },
  { name: "Apps", color: "#3b82f6" },
  { name: "Titan", color: "#8b5cf6" },
  { name: "Nebula", color: "#ec4899" },
  { name: "Jupiter", color: "#f59e0b" },
] as const;

const ANIMAL_EMOJIS = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦉",
  "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞",
  "🐢", "🐍", "🦎", "🐙", "🦑", "🦀", "🐠", "🐬", "🐳", "🦈",
  "🐊", "🦓", "🦍", "🐘", "🦒", "🐫", "🐑", "🦙", "🐐", "🐕",
  "🐈", "🦃", "🦚", "🦜", "🐇", "🦝", "🦔",
];

export default function NameEntryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [team, setTeam] = useState<string>("Mangrove");
  const [avatar, setAvatar] = useState<string>("🦊");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [error, setError] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!emojiPickerOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!emojiPickerRef.current?.contains(event.target as Node)) {
        setEmojiPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiPickerOpen]);

  function handleContinue() {
    if (!name.trim()) {
      setError(true);
      return;
    }

    // sessionStorage (not localStorage) is intentional: each browser tab keeps
    // its own player name, so multiple tabs on one machine act as multiple people.
    sessionStorage.setItem("reGamePlayerName", name.trim());
    sessionStorage.setItem("reGamePlayerTeam", team);
    router.push("/lobby");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-6">
      <div className="pointer-events-none absolute -left-48 -top-24 h-[560px] w-[560px] rounded-full bg-violet-300/50 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-40 h-[600px] w-[600px] rounded-full bg-teal-300/50 blur-[110px]" />

      <div className="relative z-10 w-full max-w-md rounded-[32px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-10">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-extrabold text-slate-800">
            🎮 re-game
          </span>
        </div>

        <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Welcome to re-game!
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Get ready to play and compete with your remote team.
        </p>

        <div className="mt-8">
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Enter your name
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="relative shrink-0" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setEmojiPickerOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={emojiPickerOpen}
                aria-label="Choose an avatar emoji"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-transparent transition hover:ring-teal-300"
              >
                {avatar}
              </button>
              {emojiPickerOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 grid max-h-48 w-56 grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  {ANIMAL_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setAvatar(emoji);
                        setEmojiPickerOpen(false);
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-teal-50 ${
                        avatar === emoji ? "bg-teal-100" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(false);
              }}
              placeholder="Name"
              className="w-full flex-1 bg-transparent py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-500">Enter your name to continue.</p>
          )}
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold text-slate-800">
            Select your team
          </label>
          <div className="flex flex-wrap gap-2">
            {TEAMS.map((t) => {
              const selected = team === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setTeam(t.name)}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                    selected
                      ? "border-teal-400 bg-teal-50 text-slate-900"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="mt-8 w-full rounded-2xl bg-teal-300 py-4 text-lg font-extrabold text-slate-900 shadow-lg shadow-teal-300/40 transition hover:bg-teal-200 active:scale-[0.99]"
        >
          Start Playing!
        </button>
      </div>
    </main>
  );
}