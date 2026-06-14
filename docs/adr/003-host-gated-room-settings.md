# ADR-003: Host-Gated Room Settings and Deferred Authorization Hardening

## Status
Accepted

## Date
2026-06-14

## Context

Room settings in the lobby — the display **language** and the new **adult /
NSFW content** toggle — should be controlled by a single person rather than
freely editable by every participant. There was no notion of a room owner in
the data model.

### Host model chosen

Rather than introduce a stored `host_player_id` column (which would require a
migration, join-time assignment, a backfill, and explicit handling of the
"host left → settings frozen" case), the host is defined **dynamically** as the
**earliest-joined active player** of the session:

- Server: `src/lib/host-auth.ts` → `requireHost(sessionId)` validates the
  cookie JWT (`validateSession`) and selects `players` where
  `session_id = …, status = 'active'`, `ORDER BY created_at ASC, id ASC LIMIT 1`,
  returning 401 (no session for this game), 403 (caller is not that player), or
  null (authorized).
- Client: `src/app/lobby/[sessionId]/page.tsx` computes `isHost` with the same
  rule (sort active players by parsed `created_at`, then `id`) and disables the
  `LanguageSelector` and the adult-content `Switch` for non-hosts, with an
  explanatory hint.

This makes the room creator (the first to join after the session is created)
the host, and transfers the role to the next-oldest active player if the
creator leaves — no frozen state, no migration.

### Enforcement added

- `PUT /api/sessions/[sessionId]/update-language` and
  `PUT /api/sessions/[sessionId]/update-adult-content` both call `requireHost`.
  Verified live: host → 200, non-host → 403, no cookie → 401, on both routes.

## Decision

1. Adopt the **dynamic earliest-active-player host model** and gate the two
   room-settings routes (and their UI controls) on it.
2. **Document, but do NOT yet fix**, the pre-existing authorization weaknesses
   that an adversarial review surfaced. The host gate is therefore a **soft /
   UX control and a partial server check, not a hard security boundary**, until
   the items below are addressed. This is an accepted trade-off for a casual
   party game with a low threat model and a deliberately small change scope.

## Known gaps (accepted for now — not fixed)

Surfaced by an adversarial multi-lens review on 2026-06-14 and confirmed against
the code. None were introduced by this change except where noted; most are
pre-existing and app-wide.

### High

- **`distribute-roles` is unauthenticated.**
  `src/app/api/sessions/[sessionId]/distribute-roles/route.ts` has no
  `validateSession`/`requireHost` and trusts a client-supplied `mysteryId`,
  unconditionally setting `status = 'playing'` and `current_mystery_id`. A
  direct caller can force-start a room **with any mystery, including an
  adult-content one the host excluded** — bypassing the new toggle's intent.
  The `mysteryId` is not validated against the room's votable / non-adult set.
- **Name-only takeover hijacks identity.**
  `src/app/api/join/takeover/route.ts` mints a session cookie for an existing
  player given only `{joinCode, playerName}` — both public (players are
  world-readable via RLS; the join code is shown in the lobby/QR). An attacker
  can take over the host's slot and obtain a cookie that passes `requireHost`.
  It also lacks a `status = 'lobby'` guard and preserves `created_at`, allowing
  silent host reassignment.
- **Kick is not host-gated.**
  `src/app/api/sessions/[sessionId]/players/[playerId]/route.ts` (DELETE) only
  checks session membership, not host. Any member can kick the current host,
  which — under the dynamic host model — promotes the next-oldest active player
  (potentially the attacker) to host and thus to control of the gated settings.
  The lobby also renders the "remove" button for non-hosts
  (`PlayerList` receives `onRemovePlayer` unconditionally).

### Medium / Low

- Kicked-player self-redirect never fires: the lobby realtime `UPDATE` handler
  reads `currentPlayerId` from a stale mount-time closure (null), so a kicked
  player's tab lingers on the lobby (server still enforces host-gating; this is
  a UX bug). `src/app/lobby/[sessionId]/page.tsx`.
- `mystery_votes` is world-writable via the anon key (vote stuffing).
- `next-round` / `vote-mystery` / `tally-votes` are gated to "any session
  member", not to the host — round advancement is not host-controlled.
- TOCTOU between the `requireHost` check and the settings write (negligible).

## Consequences

### Positive
- The requested behavior is delivered with minimal surface area (no migration):
  in the normal flow only the host changes language / adult-content, enforced
  both client-side (disabled controls) and server-side (`requireHost`).
- Host identity is self-healing (transfers when the host leaves).

### Negative
- The gate can be circumvented by a motivated attacker via the gaps above. It
  should not be relied on as a security boundary.
- Client and server host computations are kept in sync **by convention**
  (identical ordering rules) rather than a shared source of truth.

### Neutral
- No `host_player_id` column exists; "host" is always derived. Any future code
  needing the host must use the same ordering rule (`created_at`, then `id`,
  active players only) — see `requireHost`.

## Future Considerations

When the threat model warrants it (e.g. public/again-untrusted rooms), close the
gaps in priority order: (1) authenticate `distribute-roles` and validate its
`mysteryId` against the room's votable/non-adult set; (2) replace name-only
takeover with a real ownership proof (resume token); (3) host-gate the kick
route and hide the remove control from non-hosts; (4) tighten `mystery_votes`
RLS. At that point, consider promoting "host" to a stored, explicitly
transferable role.
