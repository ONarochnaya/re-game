# re:game — project context for Claude Code

## What this is
2-day hackathon project. A "zero-setup" game platform for remote teams.
Only Codenames is functionally real — everything else is UI/mock surface
to sell the platform vision. Do not over-build beyond what's specified below.

## Stack
- Next.js (App Router), TypeScript strict
- Tailwind only for styling — no CSS modules, no styled-components
- Plain React state/hooks — no Redux/Zustand/Jotai, don't suggest adding one
- No backend, no database, no auth — this is intentional, not a gap to fill
- Sync between players = BroadcastChannel API only (same-machine, multi-tab).
  Do NOT suggest websockets, Supabase, Pusher, or any network sync — out of scope.

## Screens / routes
- `/` — name entry (Screen 0)
- `/lobby` — welcome + mini scoreboard + game picker (Screen 1)
- `/scoreboard` — big scoreboard (Screen 2)
- `/room/[roomId]/codenames` — the game (Screen 3)
    - Role choice (spymaster/operative) is IN-COMPONENT STATE, not a route
    - Room is created client-side on game selection, no pre-registration

## Data reality — IMPORTANT, do not "fix" this
- Scoreboard (Screens 1 & 2) is MOCKED static data. Do not wire it to anything real.
  Both screens must read from the same mock data source/file.
- Game list on Screen 1 is MOCKED except Codenames, which navigates for real.
  Other tiles are visually present but disabled ("coming soon").
- Codenames (Screen 3) is the only screen with real game logic.

## Role visibility (known, accepted shortcut)
GameState always contains true card colors. Rendering is role-aware:
spymaster sees colors, operative doesn't. This is a client-side-only
shortcut for the demo — do not build server-side-style data filtering,
do not add "security" for this, it's explicitly out of scope for now.

## Code conventions
- Functional components only
- Game rules logic (board gen, reveal, win check) lives in pure functions,
  separate from components and separate from sync code — no side effects,
  no BroadcastChannel calls inside game-logic files
- Don't add new dependencies without asking first
- Keep components small — one screen's logic shouldn't leak into another's file

## Ownership (avoid stepping on each other)
- Olga: Screen 3 logic, sync layer (BroadcastChannel), roomId
  generation/navigation glue
- Tahnee, Sean: Screens 0, 1, 2 (fully), Screen 3 visual/styling layer

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

## Sync layer (stubbed, not implemented)
- `lib/useSync.ts` exists as a stub — currently just wraps useState with
  the future BroadcastChannel interface shape: `useSync(roomId, initialState)`
  returns `[state, setState]`. Real BroadcastChannel sync is NOT yet
  implemented — don't assume multi-tab sync works until this is built out.
- Screen 3 already calls useSync(roomId, ...) instead of raw useState,
  so wiring in real BroadcastChannel later should only touch this one file.

## Screen 3 status
- Team/role selection (3.1) is implemented as in-component conditional
  rendering, not a separate route.
- Board renders with correct role-based visibility (spymaster sees all
  colors, operative sees none) — but has NO click interactivity yet.
  Reveal-on-click, turn logic, and win display are the next iteration.