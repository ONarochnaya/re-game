# re:game

Zero-setup game sessions for remote teams. Jump straight into lightweight
favourites like Codenames — no accounts, no setup, no scheduling friction.

Built for [hackathon name], [date].

## Status
Hackathon MVP. Codenames is fully playable. Other games shown on the
platform are mocked/placeholder — see CLAUDE.md for full scope notes.

## Stack
Next.js (App Router) + TypeScript + Tailwind. No backend — game sync
uses BroadcastChannel (same-machine, multi-tab only, for demo purposes).

## Running locally
\`\`\`bash
npm install
npm run dev
\`\`\`
Open http://localhost:3000, enter a name, choose Codenames, then open
a second tab at the same room URL to simulate a second player.

## Known limitations (by design, for hackathon scope)
- No cross-device multiplayer (BroadcastChannel is same-browser only)
- No persistence — refresh loses game state
- Scoreboard data is mocked
- Only Codenames is a real game; other tiles are placeholders

## Team
[you] — game logic, sync, routing
[designer] — screens 0/1/2, visual layer