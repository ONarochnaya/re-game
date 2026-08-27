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
- Any real backend, database, or auth
- Cross-device multiplayer
- Games other than Codenames
- Persistence across page refresh / browser restart
- Reconnect/disconnect handling

## Codenames data & logic (implemented)
- Word pool lives in `lib/words.ts` — a static array of 40-50 words,
  createGame() randomly picks 25 from it. Don't regenerate or duplicate
  this list elsewhere.
- Pure game logic lives in `lib/gameEngine.ts`:
    - `createGame(wordPool)` — generates a full GameState (board + team
      distribution + starting turn). Implemented.
    - `revealCard`, `revealMultiple`, `checkWinCondition`, `passTurn` —
      STUBBED ONLY, not yet implemented (return state unchanged). Do not
      assume these work — check before building UI that depends on them.
    - This file has no React, no side effects, no sync calls — keep it
      that way when extending it.
- Role-based card rendering goes through a single helper function
  (`getCardDisplay` or similar) in the Codenames page component —
  don't inline color/reveal logic in JSX, extend the helper instead.

## Player identity (implemented)
- Screen 0 (app/page.tsx) captures a name via text input, stored in
  sessionStorage under key 'reGamePlayerName' — intentionally per-tab,
  since each browser tab represents one demo "player".
- Player type (lib/types.ts) already existed: { name, id, team?, role? }.
  GameState now also includes `players: Player[]`, initialized empty
  by createGame().

## Sync layer (implemented)
- lib/useSync.ts now uses real BroadcastChannel, scoped to `re-game:${roomId}`.
  Same signature as before: useSync(roomId, initialState) -> [state, setState].
  setState updates locally AND broadcasts; incoming messages from other
  tabs update local state.

## Sync layer — join handshake (implemented)
useSync now handles late joiners: on mount, a tab broadcasts a
'requestState' message; existing tabs respond with their current
GameState as a 'state' message, so a tab opened after others already
have game/player state gets caught up instead of starting fresh with
its own randomly-generated board and empty players list.

## Current room pointer (implemented)
- Screen 1 (app/lobby/page.tsx) stores the active roomId in localStorage
  under key 'reGameCurrentRoom' when "Play Codenames" is clicked —
  intentionally localStorage (not sessionStorage), since it needs to be
  shared across tabs in the same browser, unlike the per-tab player name.
- If a stored roomId exists, Screen 1 shows a "Join current game" option
  alongside "Play Codenames" so a second tab can join without a
  copy-pasted URL.
- Starting a new game always overwrites the stored roomId — no explicit
  "end game"/reset flow exists, out of scope for this hackathon.

## Screen 3 status (updated)
- CodenamesGame.tsx now destructures [game, setGame] from useSync (previously
  only used [game]).
- Redirects to '/' if no sessionStorage name is found.
- Team/role picker writes the player into game.players via setGame — visible
  live across tabs. A "Teams" section renders players grouped by Red/Blue.
- Changing team/role after initial pick is still NOT supported — out of
  scope until a future iteration.
- Board rendering (getCardDisplay) and role-based visibility unchanged.
- Note: createGame(WORD_POOL) is currently called inline as the initialState
  arg to useSync on every render — harmless (useState ignores it after first
  render) but worth memoizing later if it becomes a real cost.