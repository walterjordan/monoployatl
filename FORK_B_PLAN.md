# Fork B — Online multiplayer plan

This document captures the path from the current hotseat build to real online multiplayer (each player on their own laptop, no screen-share needed).

The refactor done for Fork A was set up specifically so this can be incremental rather than a rewrite.

## Why Firebase Realtime Database

Recommended over Firestore, Supabase, and PartyKit for this app because:

- **Realtime DB is dirt cheap and instant for small documents.** A single game's state is well under 100 KB.
- **No relational schema needed.** Game state is one document keyed by room code.
- **Anonymous auth works out of the box.** Players don't need accounts — they just join a room code.
- **Free tier covers casual play indefinitely** (1 GB stored, 10 GB/month transfer). Realistic ceiling: thousands of concurrent games.

Fallback options if Firebase becomes a constraint: Supabase Realtime (Postgres-flavored, same shape), PartyKit (slickest DX, more setup), Cloudflare Durable Objects (best per-room isolation, steeper learning curve).

## Architecture sketch

```
┌──────────────────────────┐         ┌──────────────────────────┐
│  Player A (laptop)       │         │  Player B (laptop)       │
│  - React UI              │         │  - React UI              │
│  - Engine functions      │         │  - Engine functions      │
│  - Local Gemini calls    │         │  - Local Gemini calls    │
└─────────┬────────────────┘         └─────────┬────────────────┘
          │                                    │
          │      Firebase Realtime DB          │
          └────────► /rooms/{roomCode} ◄───────┘
                     {
                       players: [...],
                       properties: [...],
                       currentPlayerIndex: number,
                       phase: GamePhase,
                       dice: [n, n],
                       doublesCount: number,
                       extraTurn: boolean,
                       winner: number | null,
                       gameLog: string[],
                       pending: { property, card, offer },
                       lastUpdate: timestamp,
                       lastActor: playerId,
                     }
```

The whole UI re-renders off `/rooms/{roomCode}` snapshots. Local React state becomes a thin cache that gets reconciled on each snapshot.

## Why the Fork A refactor makes this easy

The engine functions in `game/engine.ts` are all pure — they take state in, return values out. That means a roll on player A's laptop produces the same result as if the engine were re-run on player B's laptop. The hard work of "what does this turn do" is already separated from "how do I render it."

The phase state machine in `App.tsx` is also already shaped to be replicated. Every transition is explicit (`setPhase('buying')`, `setPhase('cardDraw')`), so we know exactly what to write to Firebase and what to render on receipt.

## Concrete migration steps

1. **Add `services/firebase.ts`.** Initialize Firebase app, anonymous auth, get a reference to `/rooms/{roomCode}`. Export `subscribeRoom(code, callback)` and `updateRoom(code, partial)`.

2. **Build a lobby flow.** Two screens before the game:
   - `LobbyEntry` — "Create room" (generate 4-char code) or "Join room" (enter code).
   - `LobbyWait` — show players who've joined, "Start game" button enabled when host has ≥1 opponent. Modify `SetupScreen` to write its result to Firebase instead of calling `onStart` locally.

3. **Replace local state with synced state.** In `App.tsx`, change:
   ```typescript
   const [players, setPlayers] = useState<Player[]>([]);
   const [properties, setProperties] = useState<Property[]>(PROPERTIES);
   // ...etc
   ```
   into one synced doc:
   ```typescript
   const [room, setRoom] = useGameRoom(roomCode);
   // room.players, room.properties, room.phase, room.dice, etc.
   ```
   The `useGameRoom` hook wraps Firebase subscription + a `mutate(partial)` writer.

4. **Turn gating.** Add a `myPlayerId` (from auth UID → player mapping). Disable the Roll/Trade/Manage buttons unless `room.currentPlayerIndex === myPlayerIndex`. The trade modal naturally splits across two laptops: builder writes to `room.pending.offer`, recipient sees it appear and confirms.

5. **Conflict avoidance.** Use Firebase transactions for mutations that depend on previous state (`runTransaction(roomRef, (current) => ({...current, money: current.money - 200}))`). Pure overwrites are fine for simple writes (`mutate({ phase: 'turnEnd' })`).

6. **Optimistic UI.** For the rolling player, render local state immediately; reconcile when the snapshot comes back. Other players just render off the snapshot.

7. **Reconnection.** If a player closes the tab and re-joins with the same room code + UID, they re-attach to their player slot. Firebase persistence handles this for free with anonymous auth.

## What stays the same

- All of `types.ts`, `game/data.ts`, `game/cards.ts`, `game/engine.ts` — zero changes.
- All components in `components/` — only need prop changes if they currently take callbacks (they all do; callbacks become async `mutate()` writes).
- The Gemini service stays local to each client (or moves to a Cloud Function if you want to deduplicate calls).

## What changes

- `App.tsx` — most of the state management gets replaced by the synced hook.
- New: `LobbyEntry.tsx`, `LobbyWait.tsx`, `services/firebase.ts`, `hooks/useGameRoom.ts`.
- New: a small backend rule in Firebase Realtime DB to lock room writes to authenticated players in that room.

## Time estimate

Roughly:
- Firebase setup + lobby flow: half a day
- `useGameRoom` hook + state sync: half a day
- Turn gating + trade across laptops: half a day
- Polish, reconnect, edge cases: a day

So 2-3 days of focused work to ship Fork B once you've played Fork A enough to know it's worth investing in. Don't start Fork B until you've actually played Fork A a couple of times — that playtest will surface stuff (rule tweaks, UI snags) that's much cheaper to fix in single-laptop mode.

## Things to defer past Fork B

- Spectator mode
- Replay / undo
- Voice chat (Meet handles it)
- Persistent player accounts
- Leaderboards

These are all reasonable, but Fork A → Fork B is already a meaningful arc. Don't blow scope.
