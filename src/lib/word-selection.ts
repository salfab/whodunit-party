import { createHmac } from 'crypto';

export interface RoundWords {
  guiltyWords: string[];
  innocentWords: string[];
}

/*
 * Fisher-Yates shuffle driven by an HMAC keystream instead of Math.random():
 * like the culprit selection in round-roles.ts, the draw must stay identical
 * across reloads, API calls, and server restarts, without storing anything or
 * letting clients recompute it. Each 32-byte block is derived from
 * HMAC(secret, `${seedBase}:${blockIndex}`) and consumed 4 bytes at a time.
 */
function deterministicShuffle(items: string[], secret: string, seedBase: string): string[] {
  const result = [...items];
  let blockIndex = 0;
  let block = createHmac('sha256', secret).update(`${seedBase}:${blockIndex}`).digest();
  let offset = 0;

  const nextUint32 = (): number => {
    if (offset + 4 > block.length) {
      blockIndex += 1;
      block = createHmac('sha256', secret).update(`${seedBase}:${blockIndex}`).digest();
      offset = 0;
    }
    const value = block.readUInt32BE(offset);
    offset += 4;
    return value;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = nextUint32() % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Draws the round's words from a mystery's word pool: 6 unique words,
 * partitioned into 3 guilty + 3 innocent. Deterministic for a given
 * (sessionId, mysteryId, secret), so the same word can be guilty in one
 * session and innocent in another.
 *
 * The seed deliberately excludes player IDs: unlike the culprit (who must be
 * picked among present suspects), the words must not change when a player
 * quits or rejoins mid-round.
 */
export function selectRoundWords(
  sessionId: string,
  mysteryId: string,
  wordPool: string[],
  secret: string
): RoundWords {
  if (!secret) {
    throw new Error('JWT_SECRET is required to select round words');
  }

  // Sorted so the draw only depends on the pool's contents, not on the order
  // words were authored in. Bad pools fail loudly rather than under-dealing.
  const pool = [...new Set(wordPool.map((word) => word.trim()).filter(Boolean))].sort();
  if (pool.length < 6) {
    throw new Error(`Word pool must contain at least 6 unique words, got ${pool.length}`);
  }

  const seedBase = [sessionId, mysteryId, 'words', 'v1'].join(':');
  const shuffled = deterministicShuffle(pool, secret, seedBase);

  return {
    guiltyWords: shuffled.slice(0, 3),
    innocentWords: shuffled.slice(3, 6),
  };
}
