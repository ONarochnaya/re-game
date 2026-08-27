"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {createGame} from "@/lib/gameEngine";
import {useSync} from "@/lib/useSync";
import {WORD_POOL} from "@/lib/words";
import type {Card, Role, Team} from "@/lib/types";

function getCardDisplay(card: Card, myRole: Role): string {
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

            <div className="grid grid-cols-5 gap-2">
                {game.cards.map((card) => (
                    <div
                        key={card.word}
                        className={`flex aspect-square w-24 items-center justify-center rounded p-2 text-center text-sm font-medium ${getCardDisplay(
                            card,
                            role
                        )}`}
                    >
                        {card.word}
                    </div>
                ))}
            </div>
        </main>
    );
}
