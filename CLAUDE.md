# re:game — project context for Claude Code

## What this is
2-day hackathon project: a "zero-setup" game platform for remote teams.
Only Codenames is functionally real — everything else is UI/mock surface
selling the platform vision. Don't over-build beyond what's specified here.

## Stack
- Next.js (App Router), TypeScript strict, Tailwind only (no CSS modules/styled-components)
- Plain React state/hooks — no Redux/Zustand/Jotai
- No backend, no database, no auth — intentional, not a gap to fill
- Sync = BroadcastChannel API only (same-machine, multi-tab). No websockets/Supabase/Pusher.
- Don't add new dependencies without asking first

## Routes
- `/` — name entry (Screen 0)
- `/lobby` — welcome + scoreboard preview + game picker (Screen 1)
- `/scoreboard` — full scoreboard (Screen 2)
- `/room/[roomId]/codenames` — the game (Screen 3). Role/team choice is
  in-component state, not a route. Room created client-side on game
  selection, no pre-registration.

## Data reality — don't "fix" this
- Scoreboard (Screens 1 & 2) is mocked static data, both screens share one source.
- Game list on Screen 1 is mocked except Codenames, which is real/clickable;
  other tiles show "coming soon."
- Codenames is the only screen with real logic.

## Identity & persistence
- Player name: entered on Screen 0, stored in `sessionStorage` key
  `reGamePlayerName` — intentionally per-tab (each tab = one demo player).
- Current room: stored in `localStorage` key `reGameCurrentRoom` when a
  game is created — intentionally shared across tabs, so Screen 1 shows
  "Join current game" for tabs opened after the first. Starting a new
  game always overwrites it; no explicit end/reset flow.
- No persistence across refresh beyond these two keys. No reconnect handling.

## Data model (lib/types.ts)
- `Player = { id, name, team?, role? }`
- `Card = { word, team: Team|'neutral'|'assassin', revealed }`
- `Clue = { id, team, playerName, word, number, timestamp }`
- `GameState = { cards, turn, winner, players: Player[], clueHistory: Clue[] }`

## Game logic (lib/gameEngine.ts) — pure, no React/side effects/sync calls
- `createGame(wordPool)` — implemented. Builds board + team distribution,
  initializes `players: []`, `clueHistory: []`.
- `addClue(state, clue)` — implemented. Append-only, never overwrites history.
- `revealMultiple(state, indices)` — implemented. Sets `revealed: true` on
  given indices, returns new state.
- `revealCard`, `checkWinCondition`, `passTurn` — **still stubs**, return
  state unchanged. No turn enforcement or win detection exists yet.
- Card colors are always present in `GameState` (client-visible shortcut,
  not filtered server-side) — role-based hiding happens only in rendering.

## Sync layer (lib/useSync.ts)
- Real BroadcastChannel, scoped to `re-game:${roomId}`. Signature unchanged:
  `useSync(roomId, initialState) -> [state, setState]`.
- Handles late joiners: on mount, broadcasts `requestState`; existing tabs
  respond with current `GameState` so new tabs don't start fresh.

## Screen 3 (CodenamesGame.tsx) — current behavior
- Redirects to `/` if no name in `sessionStorage`.
- Team/role picker writes the player into `game.players` via `setGame`
  (synced). Changing team/role after picking is not supported.
- Teams section lists players by team; own entry shown as "You: {name}".
- Clue form shown only to spymasters (their own team); submits via
  `addClue`. Clue history visible to everyone, newest first, own clues
  prefixed "You:".
- `getCardDisplay(card, role)`: spymasters see true colors on unrevealed
  cards; any card with `revealed: true` shows true color regardless of role.
- Operatives can click unrevealed cards to toggle local selection
  (`selectedIndices`, not synced), then "Reveal" commits via
  `revealMultiple` (synced). Spymasters cannot click cards.
- No turn enforcement anywhere yet — any player can act at any time.
- Rendered via a client-only wrapper (`CodenamesGameClient.tsx`) using
  `dynamic(..., { ssr: false })`, because `page.tsx` is a Server Component
  (it awaits `params`) and `ssr:false` isn't honored called directly from
  a Server Component in the App Router. Don't collapse this back to one file.

## Explicitly out of scope for this hackathon
- Real backend/database/auth, cross-device multiplayer, games other than
  Codenames, persistence beyond the two storage keys above, reconnect
  handling, turn enforcement/scoring (until built), changing team/role
  after initial pick.

## Ownership
- Olga: Screen 3 logic, sync layer, roomId generation/navigation
- Tahnee, Sean: Screens 0, 1, 2 fully; Screen 3 visual/styling layer

## Card reveal interactivity (implemented)
- lib/gameEngine.ts: revealMultiple(state, indices) is implemented —
  pure, sets revealed: true on given card indices, returns new state.
  revealCard, checkWinCondition, passTurn are STILL stubs — turn/win
  logic is a separate later feature.
- CodenamesGame.tsx: operatives can click unrevealed cards to toggle
  local selection (selectedIndices, NOT synced), then click "Reveal"
  to commit via setGame(revealMultiple(...)). Spymasters cannot click
  cards at all.
- getCardDisplay now shows true card color whenever card.revealed is
  true, regardless of role — previously only spymasters ever saw color.
- No turn enforcement on reveals yet — any operative on either team can
  select/reveal at any time. Revisit once turn logic is built.