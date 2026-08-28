"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {addClue, checkWinCondition, createGame, revealMultiple} from "@/lib/gameEngine";
import {useSync} from "@/lib/useSync";
import {WORD_POOL} from "@/lib/words";
import type {Card, Role, Team} from "@/lib/types";

function getCardDisplay(card: Card, myRole: Role): string {
    if (card.revealed) {
        switch (card.team) {
            case "red":
                return "bg-[#067302] text-[#ffffff] border-2 border-[#067302]";
            case "blue":
                return "bg-[#004970] text-[#ffffff] border-2 border-[#004970]";
            case "neutral":
                return "bg-[#F5F7F9] text-[#65707B] border-2 border-[#D1DCE5]";
            case "assassin":
                return "bg-[#65707B] text-white border-2 border-[#D1DCE5]";
        }
    }

    if (myRole === "spymaster") {
        switch (card.team) {
            case "red":
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
                            onClick={() => setTeam("red")}
                            className={`rounded bg-[#48B500] px-4 py-2 font-bold text-white ${
                                team === "red" ? "ring-2 ring-offset-2 ring-[#1F2B38]" : ""
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

    const redPlayers = game.players.filter((p) => p.team === "red");
    const bluePlayers = game.players.filter((p) => p.team === "blue");
    const clueHistory = [...game.clueHistory].reverse();

    const redCards = game.cards.filter((c) => c.team === "red");
    const blueCards = game.cards.filter((c) => c.team === "blue");
    const redRevealedCount = redCards.filter((c) => c.revealed).length;
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
                    {/*<h1 className="font-display text-[32px] font-bold text-[#1F2B38]">Screen 3: Codenames</h1>*/}
                    {/*<p className="text-sm text-[#65707B]">*/}
                    {/*    Room: {roomId} — {team} {role}*/}
                    {/*</p>*/}

                    <div className="grid w-full grid-cols-2 gap-4">
                        <div>
                            <p className="font-display text-2xl font-bold text-[#48B500]">Green</p>
                            <ul className="text-sm">
                                {redPlayers.map((p) => (
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
                            Green: {redRevealedCount} / {redCards.length} revealed
                        </p>
                        <p className="font-bold text-[#0069A1]">
                            Blue: {blueRevealedCount} / {blueCards.length} revealed
                        </p>
                    </div>

                    {game.winner && (
                        <p className="font-display text-2xl font-bold text-[#10B981]">
                            🎉 {game.winner === "red" ? "Green" : "Blue"} team wins!
                        </p>
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
                                        className={clue.team === "red" ? "text-[#48B500]" : "text-[#0069A1]"}
                                    >
                                        {clue.team === "red" ? "Green" : "Blue"}
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
