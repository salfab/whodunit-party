# ADR 003: Deterministic Random Culprit Selection

## Status

Accepted

## Context

Mystery packs should no longer define which suspect is guilty. Every suspect
sheet can become the culprit, provided its dark secret is written as a possible
confession.

The existing database stores only the assigned character sheet for each player.
We want to avoid a database schema migration or a new `guilty_player_id` column,
but the chosen culprit still has to remain stable for the whole round.

## Decision

The application resolves the culprit on the server with deterministic
randomness:

- collect the player assignments for the session and mystery;
- treat the assigned investigator sheet as the investigator;
- treat every other assignment as a suspect, regardless of whether the legacy
  sheet role is `guilty` or `innocent`;
- sort suspect player IDs;
- compute an HMAC SHA-256 with `JWT_SECRET` over the session ID, mystery ID,
  sorted suspect IDs, and a version marker, formatted as
  `sessionId:mysteryId:sortedSuspectPlayerIds:v1`;
- use the digest to pick one suspect index.

This gives the same culprit every time the same round is resolved, while keeping
the result impossible for clients to calculate without the server secret.

## Alternatives Considered

- Plain `Math.random()`: rejected because the culprit could change between page
  load, accusation submission, reveal fetching, or a server restart.
- Store the chosen culprit in the database: rejected for now because it requires
  a schema migration and more lifecycle handling.
- Keep the culprit defined in the pack: rejected because it reduces replayability
  and makes authoring prone to spoilers.

## Consequences

- No database schema migration is needed.
- `JWT_SECRET` must be configured for gameplay endpoints that resolve roles.
- The assignment list must be stable once a round starts; changing assignments
  before accusation can change the deterministic culprit.
- Existing `guilty` and `innocent` sheet roles become legacy content labels, not
  gameplay truth.
