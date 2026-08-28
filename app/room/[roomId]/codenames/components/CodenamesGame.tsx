"use client";

import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {addClue, checkWinCondition, createGame, revealMultiple} from "@/lib/gameEngine";
import {useSync} from "@/lib/useSync";
import {WORD_POOL} from "@/lib/words";
import type {Card, Role, Team} from "@/lib/types";

const CELEBRATION_BUTTERFLY_COUNT = 10;
const CELEBRATION_ANIMATION_MS = 3000;
const CELEBRATION_STAGGER_MS = 300;

function getTeamHex(team: Team): string {
    return team === "green" ? "#48B500" : "#0069A1";
}

function getCardDisplay(card: Card, myRole: Role): string {
    if (card.revealed) {
        if (myRole === "operative") {
            switch (card.team) {
                case "green":
                    return "bg-[#48B500] text-white border-2 border-[#D1DCE5]";
                case "blue":
                    return "bg-[#0069A1] text-white border-2 border-[#D1DCE5]";
                case "neutral":
                    return "bg-[#F5F7F9] text-[#65707B] border-2 border-[#D1DCE5]";
                case "assassin":
                    return "bg-[#65707B] text-white border-2 border-[#D1DCE5]";
            }
        }

        switch (card.team) {
            case "green":
                return "bg-[#ffffff] text-[#339E38] border-2 border-[#339E38]";
            case "blue":
                return "bg-[#ffffff] text-[#4692BC] border-2 border-[#4692BC]";
            case "neutral":
                return "bg-[#F5F7F9] text-[#65707B] border-2 border-[#D1DCE5]";
            case "assassin":
                return "bg-[#65707B] text-white border-2 border-[#D1DCE5]";
        }
    }

    if (myRole === "spymaster") {
        switch (card.team) {
            case "green":
                return "bg-[#48B500] text-white";
            case "blue":
                return "bg-[#0069A1] text-white";
            case "neutral":
                return "bg-[#D1DCE5] text-[#1F2B38]";
            case "assassin":
                return "bg-[#1F2B38] text-white";
        }
    }

    return "bg-[#D1DCE5] text-[#1F2B38]";
}

export default function CodenamesGame({roomId}: { roomId: string }) {
    const router = useRouter();
    const [game, setGame] = useSync(roomId, createGame(WORD_POOL));
    const [team, setTeam] = useState<Team | null>(null);
    const [role, setRole] = useState<Role | null>(null);
    const [clueWord, setClueWord] = useState("");
    const [clueNumber, setClueNumber] = useState("");
    const [clueError, setClueError] = useState<string | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [showCelebration, setShowCelebration] = useState(false);
    const previousWinnerRef = useRef<Team | null>(null);
    const [playerName] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        return sessionStorage.getItem("reGamePlayerName");
    });

    useEffect(() => {
        if (!playerName) {
            router.replace("/");
        }
    }, [playerName, router]);

    useEffect(() => {
        const previousWinner = previousWinnerRef.current;
        previousWinnerRef.current = game.winner;

        if (!previousWinner && game.winner) {
            setShowCelebration(true);
            const totalDurationMs =
                CELEBRATION_ANIMATION_MS + (CELEBRATION_BUTTERFLY_COUNT - 1) * CELEBRATION_STAGGER_MS;
            const timeout = setTimeout(() => setShowCelebration(false), totalDurationMs);
            return () => clearTimeout(timeout);
        }
    }, [game.winner]);

    useEffect(() => {
        if (!team || !role || !playerName) return;

        setGame((prev) => {
            const alreadyJoined = prev.players.some((p) => p.name === playerName);
            if (alreadyJoined) return prev;

            return {
                ...prev,
                players: [
                    ...prev.players,
                    {id: crypto.randomUUID(), name: playerName, team, role},
                ],
            };
        });
    }, [team, role, playerName, setGame]);

    if (!playerName) {
        return null;
    }

    if (!team || !role) {
        return (
            <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
                <h1 className="font-display text-[32px] font-bold text-[#1F2B38]">Codenames</h1>
                {/*<p className="text-sm text-[#65707B]">Room: {roomId}</p>*/}

                <div className="flex flex-col items-center gap-2">
                    <p className="font-display text-2xl font-bold text-[#1F2B38]">Pick a team</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTeam("green")}
                            className={`rounded bg-[#48B500] px-4 py-2 font-bold text-white ${
                                team === "green" ? "ring-2 ring-offset-2 ring-[#1F2B38]" : ""
                            }`}
                        >
                            Green
                        </button>
                        <button
                            onClick={() => setTeam("blue")}
                            className={`rounded bg-[#0069A1] px-4 py-2 font-bold text-white ${
                                team === "blue" ? "ring-2 ring-offset-2 ring-[#1F2B38]" : ""
                            }`}
                        >
                            Blue
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <p className="font-display text-2xl font-bold text-[#1F2B38]">Pick a role</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setRole("spymaster")}
                            className={`rounded border px-4 py-2 font-bold ${
                                role === "spymaster"
                                    ? "border-[#8B5CF6] bg-[#8B5CF6] text-white"
                                    : "border-[#D1DCE5] text-[#1F2B38]"
                            }`}
                        >
                            Spymaster
                        </button>
                        <button
                            onClick={() => setRole("operative")}
                            className={`rounded border px-4 py-2 font-bold ${
                                role === "operative"
                                    ? "border-[#8B5CF6] bg-[#8B5CF6] text-white"
                                    : "border-[#D1DCE5] text-[#1F2B38]"
                            }`}
                        >
                            Operative
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const greenPlayers = game.players.filter((p) => p.team === "green");
    const bluePlayers = game.players.filter((p) => p.team === "blue");
    const clueHistory = [...game.clueHistory].reverse();

    const greenCards = game.cards.filter((c) => c.team === "green");
    const blueCards = game.cards.filter((c) => c.team === "blue");
    const greenRevealedCount = greenCards.filter((c) => c.revealed).length;
    const blueRevealedCount = blueCards.filter((c) => c.revealed).length;

    function handleGiveClue() {
        if (!team || !playerName) return;

        const trimmedWord = clueWord.trim();
        const parsedNumber = Number(clueNumber);
        const isValidNumber =
            clueNumber.trim() !== "" &&
            Number.isInteger(parsedNumber) &&
            parsedNumber >= 0;

        if (!trimmedWord || !isValidNumber) {
            setClueError("Enter a word and a non-negative whole number.");
            return;
        }

        setClueError(null);
        setGame((prev) =>
            addClue(prev, {team, playerName, word: trimmedWord, number: parsedNumber})
        );
        setClueWord("");
        setClueNumber("");
    }

    function toggleCardSelection(index: number) {
        if (role !== "operative" || game.cards[index].revealed) return;

        setSelectedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }

    function handleReveal() {
        if (selectedIndices.size === 0) return;

        setGame((prev) => {
            const revealed = revealMultiple(prev, Array.from(selectedIndices));
            const winner = checkWinCondition(revealed);
            return {...revealed, winner};
        });
        setSelectedIndices(new Set());
    }

    return (
        <main className="flex flex-1 items-center justify-center p-8">
            <div className="flex items-start gap-8">
                <div className="flex w-full max-w-md flex-col gap-4">
                    <h1 className="font-display text-[32px] font-bold text-[#1F2B38]">Screen 3: Codenames</h1>
                    <p className="text-sm text-[#65707B]">
                        Room: {roomId} — {team} {role}
                    </p>

                    <div className="grid w-full grid-cols-2 gap-4">
                        <div>
                            <p className="font-display text-2xl font-bold text-[#48B500]">Green</p>
                            <ul className="text-sm">
                                {greenPlayers.map((p) => (
                                    <li key={p.id}>
                                        {p.name === playerName ? `You: ${p.name}` : p.name} (
                                        {p.role === "spymaster" ? "Spymaster" : "Operative"})
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="font-display text-2xl font-bold text-[#0069A1]">Blue</p>
                            <ul className="text-sm">
                                {bluePlayers.map((p) => (
                                    <li key={p.id}>
                                        {p.name === playerName ? `You: ${p.name}` : p.name} (
                                        {p.role === "spymaster" ? "Spymaster" : "Operative"})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-6 text-sm">
                        <p className="font-bold text-[#48B500]">
                            Green: {greenRevealedCount} / {greenCards.length} revealed
                        </p>
                        <p className="font-bold text-[#0069A1]">
                            Blue: {blueRevealedCount} / {blueCards.length} revealed
                        </p>
                    </div>

                    {game.winner && (
                        <p
                            className="font-display text-2xl font-bold"
                            style={{ color: game.winner === "green" ? "#48B500" : "#0069A1" }}
                        >
                            🎉 {game.winner === "green" ? "Green" : "Blue"} team wins!
                        </p>
                    )}

                    {showCelebration && game.winner && (
                        <div className="pointer-events-none fixed inset-0 z-50">
                            {Array.from({length: CELEBRATION_BUTTERFLY_COUNT}).map((_, i) => (
                                <span
                                    key={i}
                                    className="absolute bottom-0 text-3xl"
                                    style={{
                                        left: `${5 + i * (90 / (CELEBRATION_BUTTERFLY_COUNT - 1))}%`,
                                        animation: `butterfly-float ${CELEBRATION_ANIMATION_MS}ms ease-in-out forwards`,
                                        animationDelay: `${i * CELEBRATION_STAGGER_MS}ms`,
                                        filter: `drop-shadow(0 0 6px ${getTeamHex(game.winner!)}) drop-shadow(0 0 6px ${getTeamHex(game.winner!)})`,
                                    }}
                                >
                                    🦋
                                </span>
                            ))}
                        </div>
                    )}

                    {role === "spymaster" && (
                        <div className="flex flex-col gap-2">
                            <p className="font-display text-2xl font-bold text-[#1F2B38]">Give a clue</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={clueWord}
                                    onChange={(e) => setClueWord(e.target.value)}
                                    placeholder="Word"
                                    className="rounded border border-[#D1DCE5] px-3 py-1"
                                />
                                <input
                                    type="text"
                                    value={clueNumber}
                                    onChange={(e) => setClueNumber(e.target.value)}
                                    placeholder="Number"
                                    className="w-20 rounded border border-[#D1DCE5] px-3 py-1"
                                />
                                <button
                                    onClick={handleGiveClue}
                                    className="rounded bg-[#8B5CF6] px-4 py-1 font-bold text-white"
                                >
                                    Give Clue
                                </button>
                            </div>
                            {clueError && <p className="text-sm text-[#EC4899]">{clueError}</p>}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <p className="font-display text-2xl font-bold text-[#1F2B38]">Clue History</p>
                        <ul className="text-sm">
                            {clueHistory.map((clue) => (
                                <li key={clue.id}>
                                    <span
                                        className={clue.team === "green" ? "text-[#48B500]" : "text-[#0069A1]"}
                                    >
                                        {clue.team === "green" ? "Green" : "Blue"}
                                    </span>
                                    {" — "}
                                    {clue.playerName === playerName ? `You: ${clue.playerName}` : clue.playerName}
                                    : {clue.word.toUpperCase()} ({clue.number})
                                </li>
                            ))}
                        </ul>
                    </div>

                    {role === "operative" && (
                        <button
                            onClick={handleReveal}
                            disabled={selectedIndices.size === 0}
                            className="self-start rounded bg-[#10B981] px-4 py-2 font-bold text-white disabled:opacity-40"
                        >
                            Reveal
                        </button>
                    )}
                </div>

                <div className="shrink-0">
                    <div className="grid grid-cols-5 gap-2">
                        {game.cards.map((card, index) => {
                            const isSelected = !card.revealed && selectedIndices.has(index);
                            const isClickable = role === "operative" && !card.revealed;

                            return (
                                <div
                                    key={card.word}
                                    onClick={isClickable ? () => toggleCardSelection(index) : undefined}
                                    className={`flex aspect-square w-24 items-center justify-center rounded p-2 text-center text-sm ${
                                        card.revealed ? "font-bold" : "font-medium"
                                    } ${getCardDisplay(
                                        card,
                                        role
                                    )} ${isClickable ? "cursor-pointer" : ""} ${
                                        isSelected ? "ring-2 ring-[#8B5CF6]" : ""
                                    }`}
                                >
                                    {card.word}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </main>
    );
}
