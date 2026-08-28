"use client";

import Link from "next/link";
import { useState } from "react";
import scoreboardCard from "../lobby/scoreboard-card.png";
import scoreboardCardTeams from "../lobby/scoreboard-card-teams.png";

export default function ScoreboardPage() {
  const [showTeams, setShowTeams] = useState(false);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
        <Link href="/lobby" className="self-start text-sm font-medium underline">
          ← Back to Lobby
        </Link>

        <button
          type="button"
          onClick={() => setShowTeams((isShowingTeams) => !isShowingTeams)}
          aria-label={showTeams ? "Show scoreboard" : "Show team scoreboard"}
          className="block w-full max-w-3xl cursor-pointer rounded-2xl text-left"
        >
          <img
            src={showTeams ? scoreboardCardTeams.src : scoreboardCard.src}
            alt={showTeams ? "Scoreboard by teams" : "Scoreboard card"}
            className="block w-full rounded-2xl"
          />
        </button>
      </div>
    </main>
  );
}