import Link from "next/link";
import scoreboardCard from "../lobby/scoreboard-card.png";

export default function ScoreboardPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
        <Link href="/lobby" className="self-start text-sm font-medium underline">
          ← Back to Lobby
        </Link>

        <img
          src={scoreboardCard.src}
          alt="Scoreboard card"
          className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-lg"
        />
      </div>
    </main>
  );
}