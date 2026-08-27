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
                return "bg-red-200 text-red-400 border-2 border-gray-400";
            case "blue":
                return "bg-blue-200 text-blue-400 border-2 border-gray-400";
            case "neutral":
                return "bg-yellow-50 text-gray-400 border-2 border-gray-400";
            case "assassin":
                return "bg-gray-700 text-gray-400 border-2 border-gray-400";
        }
    }

    if (myRole === "spymaster") {
        switch (card.team) {
            case "red":
                return "bg-red-400 text-white";
            case "blue":
                return "bg-blue-400 text-white";
            case "neutral":
                return "bg-yellow-100 text-black";
            case "assassin":
                return "bg-black text-white";
        }
    }

    return "bg-gray-200 text-gray-800";
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
                <h1 className="text-2xl font-semibold">Screen 3: Codenames</h1>
                <p className="text-sm text-zinc-500">Room: {roomId}</p>

                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium">Pick a team</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTeam("red")}
                            className={`rounded px-4 py-2 text-white ${
                                team === "red" ? "bg-red-600" : "bg-red-400"
                            }`}
                        >
                            Red
                        </button>
                        <button
                            onClick={() => setTeam("blue")}
                            className={`rounded px-4 py-2 text-white ${
                                team === "blue" ? "bg-blue-600" : "bg-blue-400"
                            }`}
                        >
                            Blue
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium">Pick a role</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setRole("spymaster")}
                            className={`rounded border px-4 py-2 ${
                                role === "spymaster" ? "border-black font-semibold" : "border-zinc-300"
                            }`}
                        >
                            Spymaster
                        </button>
                        <button
                            onClick={() => setRole("operative")}
                            className={`rounded border px-4 py-2 ${
                                role === "operative" ? "border-black font-semibold" : "border-zinc-300"
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
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <h1 className="text-2xl font-semibold">Screen 3: Codenames</h1>
            <p className="text-sm text-zinc-500">
                Room: {roomId} — {team} {role}
            </p>

            <div className="grid w-full max-w-md grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-semibold text-red-600">Red</p>
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
                    <p className="text-sm font-semibold text-blue-600">Blue</p>
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
                <p className="font-medium text-red-600">
                    Red: {redRevealedCount} / {redCards.length} revealed
                </p>
                <p className="font-medium text-blue-600">
                    Blue: {blueRevealedCount} / {blueCards.length} revealed
                </p>
            </div>

            {game.winner && (
                <p className="text-lg font-semibold">
                    🎉 {game.winner === "red" ? "Red" : "Blue"} team wins!
                </p>
            )}

            {role === "spymaster" && (
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium">Give a clue</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={clueWord}
                            onChange={(e) => setClueWord(e.target.value)}
                            placeholder="Word"
                            className="rounded border border-zinc-300 px-3 py-1"
                        />
                        <input
                            type="text"
                            value={clueNumber}
                            onChange={(e) => setClueNumber(e.target.value)}
                            placeholder="Number"
                            className="w-20 rounded border border-zinc-300 px-3 py-1"
                        />
                        <button
                            onClick={handleGiveClue}
                            className="rounded bg-black px-4 py-1 text-white dark:bg-white dark:text-black"
                        >
                            Give Clue
                        </button>
                    </div>
                    {clueError && <p className="text-sm text-red-500">{clueError}</p>}
                </div>
            )}

            <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium">Clue History</p>
                <ul className="text-sm">
                    {clueHistory.map((clue) => (
                        <li key={clue.id}>
                            <span
                                className={clue.team === "red" ? "text-red-600" : "text-blue-600"}
                            >
                                {clue.team === "red" ? "Red" : "Blue"}
                            </span>
                            {" — "}
                            {clue.playerName === playerName ? `You: ${clue.playerName}` : clue.playerName}
                            : {clue.word.toUpperCase()} ({clue.number})
                        </li>
                    ))}
                </ul>
            </div>

            <div className="grid grid-cols-5 gap-2">
                {game.cards.map((card, index) => {
                    const isSelected = !card.revealed && selectedIndices.has(index);
                    const isClickable = role === "operative" && !card.revealed;

                    return (
                        <div
                            key={card.word}
                            onClick={isClickable ? () => toggleCardSelection(index) : undefined}
                            className={`flex aspect-square w-24 items-center justify-center rounded p-2 text-center text-sm font-medium ${getCardDisplay(
                                card,
                                role
                            )} ${isClickable ? "cursor-pointer" : ""} ${
                                isSelected ? "ring-2 ring-black" : ""
                            }`}
                        >
                            {card.word}
                        </div>
                    );
                })}
            </div>

            {role === "operative" && (
                <button
                    onClick={handleReveal}
                    disabled={selectedIndices.size === 0}
                    className="rounded bg-black px-4 py-2 text-white disabled:opacity-40 dark:bg-white dark:text-black"
                >
                    Reveal
                </button>
            )}
        </main>
    );
}
