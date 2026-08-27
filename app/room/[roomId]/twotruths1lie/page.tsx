"use client";

import { use, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

type Statement = { text: string; isLie: boolean };
type SharedGame = {
  liarId: string;
  statements: Statement[];
  phase: "setup" | "guessing" | "complete";
  result: "won" | "lost" | null;
  guessedLieIndex: number | null;
};

const emptyGame: SharedGame = {
  liarId: "",
  statements: [],
  phase: "setup",
  result: null,
  guessedLieIndex: null,
};

export default function TwoTruths1LiePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const [playerId] = useState(() => {
    if (typeof window === "undefined") return "";
    const storedId = sessionStorage.getItem("reGameTwoTruthsPlayerId");
    const nextId = storedId ?? crypto.randomUUID();
    sessionStorage.setItem("reGameTwoTruthsPlayerId", nextId);
    return nextId;
  });
  const [game, setGame] = useState<SharedGame>(() => {
    if (typeof window === "undefined") return emptyGame;
    const stored = localStorage.getItem(`reGameTwoTruths1Lie:${roomId}`);
    return stored ? (JSON.parse(stored) as SharedGame) : emptyGame;
  });
  const [role, setRole] = useState<"liar" | "guesser" | null>(null);
  const [draft, setDraft] = useState(["", "", ""]);
  const [answers, setAnswers] = useState<("truth" | "lie")[]>(["truth", "truth", "truth"]);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = `reGameTwoTruths1Lie:${roomId}`;

    function onStorage(event: StorageEvent) {
      if (event.key === key && event.newValue) setGame(JSON.parse(event.newValue) as SharedGame);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [roomId]);

  function save(nextGame: SharedGame) {
    setGame(nextGame);
    localStorage.setItem(`reGameTwoTruths1Lie:${roomId}`, JSON.stringify(nextGame));
  }

  function chooseLiar() {
    if (!game.liarId) {
      setRole("liar");
      save({ ...game, liarId: playerId });
    }
  }

  function confirmStatements() {
    if (draft.some((statement) => !statement.trim())) {
      setError("Complete all three statements first.");
      return;
    }
    save({
      ...game,
      statements: draft.map((text, index) => ({ text: text.trim(), isLie: index === 2 })),
      phase: "guessing",
    });
    setError("");
  }

  function chooseGuesser() {
    if (game.phase === "guessing" && game.liarId !== playerId) setRole("guesser");
  }

  function confirmGuess() {
    const lieIndex = answers.findIndex((answer) => answer === "lie");
    if (role !== "guesser" || lieIndex < 0) {
      setError("Choose one statement as the lie.");
      return;
    }
    save({
      ...game,
      phase: "complete",
      result: lieIndex === 2 ? "won" : "lost",
      guessedLieIndex: lieIndex,
    });
    setError("");
  }

  const isLiar = game.liarId === playerId || role === "liar";
  const visibleStatements = game.statements.length
    ? game.statements
    : draft.map((text, index) => ({ text, isLie: index === 2 }));

  return (
    <main className="min-h-screen bg-[#F5F7F9] px-6 py-12 font-sans text-[#1F2B38]">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8">
        <header className="text-center">
          <div className="flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-wide text-[#65707B]">
            <Link href="/lobby" className="normal-case underline underline-offset-4">
              Back to the overview
            </Link>
            <span>Room {roomId}</span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold">Two Truths and a Lie</h1>
        </header>

        {game.phase === "complete" ? (
          <section className="w-full rounded-2xl border-2 border-[#D1DCE5] bg-white p-8 text-center shadow-sm">
            <h2 className="font-display text-3xl font-bold">{game.result === "won" ? "Congratulations" : "You lost"}</h2>
            <p className="mt-3 text-lg">The lie was statement {(game.guessedLieIndex ?? 0) + 1}.</p>
            <StatementList statements={game.statements} showAnswers />
          </section>
        ) : isLiar ? (
          <section className="w-full rounded-2xl border-2 border-[#F280B8] bg-[#FEF1F7] p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold">Your statements</h2>
            <p className="mt-2">Write two truths and one lie.</p>
            <div className="mt-6 flex flex-col gap-4">
              {draft.map((text, index) => (
                <label key={index} className="flex flex-col gap-2 font-bold">
                  {index === 2 ? "Lie" : "Truth"}
                  <input
                    value={text}
                    disabled={game.phase !== "setup"}
                    onChange={(event) => {
                      const next = [...draft];
                      next[index] = event.target.value;
                      setDraft(next);
                    }}
                    className="rounded-lg border-2 border-[#D1DCE5] bg-white px-4 py-3 font-normal outline-none focus:border-[#1F2B38]"
                  />
                </label>
              ))}
            </div>
            {game.phase === "setup" && <ActionButton onClick={confirmStatements}>Confirm</ActionButton>}
          </section>
        ) : (
          <section className="w-full rounded-2xl border-2 border-[#C0F6F7] bg-[#F1FDFD] p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold">Make your guess</h2>
            <div className="mt-6 flex flex-col gap-4">
              {visibleStatements.map((statement, index) => (
                <div key={index} className="rounded-lg border-2 border-[#D1DCE5] bg-white p-4">
                  <p className="font-bold">Statement {index + 1}</p>
                  <p className="mt-1 text-lg">{statement.text || "Waiting for the liar..."}</p>
                  <div className="mt-3 flex gap-2">
                    {(["truth", "lie"] as const).map((answer) => (
                      <button
                        key={answer}
                        type="button"
                        disabled={role !== "guesser"}
                        onClick={() => {
                          const next = [...answers];
                          next[index] = answer;
                          setAnswers(next);
                        }}
                        className={`rounded-lg border-2 px-4 py-2 font-bold capitalize ${answers[index] === answer ? "border-[#1F2B38] bg-[#D1DCE5]" : "border-[#D1DCE5] bg-white"} disabled:cursor-not-allowed disabled:opacity-45`}
                      >
                        {answer}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {role === "guesser" && <ActionButton onClick={confirmGuess}>Confirm</ActionButton>}
          </section>
        )}

        {game.phase !== "complete" && (
          <div className="flex flex-wrap justify-center gap-4">
            <ActionButton disabled={game.phase !== "guessing" || isLiar} onClick={chooseGuesser}>I&apos;m a guesser</ActionButton>
            <ActionButton disabled={Boolean(game.liarId)} onClick={chooseLiar}>I&apos;m the liar</ActionButton>
          </div>
        )}
        {error && <p className="font-bold">{error}</p>}
      </div>
    </main>
  );
}

function StatementList({ statements, showAnswers = false }: { statements: Statement[]; showAnswers?: boolean }) {
  return (
    <div className="mt-6 flex flex-col gap-4 text-left">
      {statements.map((statement, index) => (
        <div key={index} className="rounded-lg border-2 border-[#D1DCE5] bg-white p-4">
          <p className="font-bold">Statement {index + 1}</p>
          <p className="mt-1 text-lg">{statement.text}</p>
          {showAnswers && <p className="mt-2 font-bold">Correct answer: {statement.isLie ? "Lie" : "Truth"}</p>}
        </div>
      ))}
    </div>
  );
}

function ActionButton({ children, disabled = false, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-6 rounded-lg border-2 border-[#1F2B38] bg-[#D1DCE5] px-5 py-3 font-bold transition hover:bg-[#C0F6F7] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}
