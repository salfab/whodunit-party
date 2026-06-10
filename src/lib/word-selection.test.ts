import { describe, expect, it } from 'vitest';
import { selectRoundWords } from './word-selection';

const SECRET = 'test-secret';
const SESSION_ID = '11111111-1111-1111-1111-111111111111';
const MYSTERY_ID = '22222222-2222-2222-2222-222222222222';

const POOL_15 = [
  'lanterne', 'archive', 'verrou', 'pellicule', 'tisane',
  'soufflet', 'registre', 'verrière', 'pendule', 'cendrier',
  'tapisserie', 'flacon', 'partition', 'malle', 'paravent',
];

describe('selectRoundWords', () => {
  it('is deterministic: identical inputs yield identical words', () => {
    const first = selectRoundWords(SESSION_ID, MYSTERY_ID, POOL_15, SECRET);
    const second = selectRoundWords(SESSION_ID, MYSTERY_ID, POOL_15, SECRET);

    expect(second).toEqual(first);
  });

  it('returns 3 guilty + 3 innocent words, all unique and from the pool', () => {
    const { guiltyWords, innocentWords } = selectRoundWords(SESSION_ID, MYSTERY_ID, POOL_15, SECRET);
    const all = [...guiltyWords, ...innocentWords];

    expect(guiltyWords).toHaveLength(3);
    expect(innocentWords).toHaveLength(3);
    expect(new Set(all).size).toBe(6);
    for (const word of all) {
      expect(POOL_15).toContain(word);
    }
  });

  it('does not depend on the order of the input pool', () => {
    const reversed = [...POOL_15].reverse();
    const fromOriginal = selectRoundWords(SESSION_ID, MYSTERY_ID, POOL_15, SECRET);
    const fromReversed = selectRoundWords(SESSION_ID, MYSTERY_ID, reversed, SECRET);

    expect(fromReversed).toEqual(fromOriginal);
  });

  it('varies across sessions and mysteries', () => {
    const baseline = selectRoundWords(SESSION_ID, MYSTERY_ID, POOL_15, SECRET);
    const otherSessions = Array.from({ length: 20 }, (_, i) =>
      selectRoundWords(`session-${i}`, MYSTERY_ID, POOL_15, SECRET)
    );
    const otherMysteries = Array.from({ length: 20 }, (_, i) =>
      selectRoundWords(SESSION_ID, `mystery-${i}`, POOL_15, SECRET)
    );

    expect(otherSessions.some((r) => JSON.stringify(r) !== JSON.stringify(baseline))).toBe(true);
    expect(otherMysteries.some((r) => JSON.stringify(r) !== JSON.stringify(baseline))).toBe(true);
  });

  it('lets the same word switch sides between sessions', () => {
    const word = POOL_15[0];
    let seenGuilty = false;
    let seenInnocent = false;

    for (let i = 0; i < 200 && !(seenGuilty && seenInnocent); i++) {
      const { guiltyWords, innocentWords } = selectRoundWords(`session-${i}`, MYSTERY_ID, POOL_15, SECRET);
      if (guiltyWords.includes(word)) seenGuilty = true;
      if (innocentWords.includes(word)) seenInnocent = true;
    }

    expect(seenGuilty).toBe(true);
    expect(seenInnocent).toBe(true);
  });

  it('trims and deduplicates the pool before drawing', () => {
    const messy = ['  lanterne ', 'lanterne', 'archive', 'verrou', 'pellicule', 'tisane', 'soufflet', ''];
    const { guiltyWords, innocentWords } = selectRoundWords(SESSION_ID, MYSTERY_ID, messy, SECRET);
    const all = [...guiltyWords, ...innocentWords];

    expect(new Set(all).size).toBe(6);
    for (const word of all) {
      expect(word).toBe(word.trim());
      expect(word).not.toBe('');
    }
  });

  it('throws when fewer than 6 unique words remain', () => {
    expect(() => selectRoundWords(SESSION_ID, MYSTERY_ID, ['a', 'b', 'c', 'd', 'e'], SECRET)).toThrow(/6 unique/);
    expect(() => selectRoundWords(SESSION_ID, MYSTERY_ID, ['a', 'a', 'b', 'b', 'c', 'd', ' c '], SECRET)).toThrow(/6 unique/);
  });

  it('throws when the secret is missing', () => {
    expect(() => selectRoundWords(SESSION_ID, MYSTERY_ID, POOL_15, '')).toThrow(/JWT_SECRET/);
  });

  // Golden test: pins the algorithm. If this fails, the draw changed for every
  // round in flight (players would see their words change mid-game).
  it('keeps the draw stable across releases', () => {
    const result = selectRoundWords(SESSION_ID, MYSTERY_ID, POOL_15, SECRET);

    expect(result).toEqual(GOLDEN_RESULT);
  });
});

const GOLDEN_RESULT = {
  guiltyWords: ['registre', 'soufflet', 'cendrier'],
  innocentWords: ['malle', 'partition', 'paravent'],
};
