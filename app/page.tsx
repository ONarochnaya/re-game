"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Cosmetic "team" flavor for the welcome screen only — unrelated to the
// red/blue Codenames Team type, which players pick in-game on Screen 3.
// Dot colors drawn from the CLAUDE.md palette (Green/Cyan/Purple/Pink).
const TEAMS = [
  { name: "Forest", color: "#10B981" },
  { name: "Mangrove", color: "#5FE8EC" },
  { name: "Ocean", color: "#90EFF2" },
  { name: "Apps", color: "#8B5CF6" },
  { name: "Titan", color: "#AE8EF9" },
  { name: "Nebula", color: "#EC4899" },
  { name: "Jupiter", color: "#F280B8" },
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
  const [team, setTeam] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("🦊");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [teamError, setTeamError] = useState(false);
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
    const nameMissing = !name.trim();
    const teamMissing = !team;
    setNameError(nameMissing);
    setTeamError(teamMissing);
    if (nameMissing || teamMissing) return;

    // sessionStorage (not localStorage) is intentional: each browser tab keeps
    // its own player name, so multiple tabs on one machine act as multiple people.
    sessionStorage.setItem("reGamePlayerName", name.trim());
    sessionStorage.setItem("reGamePlayerTeam", team);
    router.push("/lobby");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-6 font-sans text-[#1F2B38]">
      <div className="pointer-events-none absolute -left-48 -top-24 h-[560px] w-[560px] rounded-full bg-violet-300/50 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-40 h-[600px] w-[600px] rounded-full bg-teal-300/50 blur-[110px]" />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#D1DCE5] bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-10">
        <div id="logo" className="mb-6 flex justify-center">
          <img src="/logo-regame.svg" alt="re-game" className="h-8 w-auto" />
        </div>

        <h1 className="text-center font-display text-[32px] font-bold leading-tight text-[#1F2B38] sm:text-[40px]">
          Welcome to re-game!
        </h1>
        <p className="mt-2 text-center text-base text-[#65707B]">
          Get ready to play and compete with your remote team.
        </p>

        <div className="mt-8">
          <label className="mb-2 block text-base font-bold text-[#1F2B38]">
            Enter your name
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-[#D1DCE5] bg-[#F5F7F9] px-3 py-2">
            <div className="relative shrink-0" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setEmojiPickerOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={emojiPickerOpen}
                aria-label="Choose an avatar emoji"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-transparent transition hover:ring-[#5FE8EC]"
              >
                {avatar}
              </button>
              {emojiPickerOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 grid max-h-48 w-56 grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-[#D1DCE5] bg-white p-2 shadow-xl">
                  {ANIMAL_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setAvatar(emoji);
                        setEmojiPickerOpen(false);
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-[#F1FDFD] ${
                        avatar === emoji ? "bg-[#F1FDFD]" : ""
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
                setNameError(false);
              }}
              placeholder="Name"
              className="w-full flex-1 bg-transparent py-1.5 text-[#1F2B38] placeholder:text-[#65707B] focus:outline-none"
            />
          </div>
          {nameError && (
            <p className="mt-2 text-sm text-[#EC4899]">Enter your name to continue.</p>
          )}
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-base font-bold text-[#1F2B38]">
            Select your team
          </label>
          <div className="flex flex-wrap gap-2">
            {TEAMS.map((t) => {
              const selected = team === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    setTeam(t.name);
                    setTeamError(false);
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                    selected
                      ? "border-[#5FE8EC] bg-[#F1FDFD] text-[#1F2B38]"
                      : "border-[#D1DCE5] text-[#65707B] hover:border-[#5FE8EC]"
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
          {teamError && (
            <p className="mt-2 text-sm text-[#EC4899]">Select a team to continue.</p>
          )}
        </div>

        <button
          onClick={handleContinue}
          className="mt-8 w-full rounded-lg bg-[#8B5CF6] py-4 text-lg font-bold text-white shadow-lg shadow-[#8B5CF6]/40 transition hover:bg-[#AE8EF9] active:scale-[0.99]"
        >
          Start Playing!
        </button>
      </div>
    </main>
  );
}