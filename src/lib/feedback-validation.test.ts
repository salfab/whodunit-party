import { describe, expect, it } from 'vitest';
import { MAX_COMMENT_LENGTH, validateFeedbackPayload } from './feedback-validation';

const ROUND_WORDS = ['lanterne', 'archive', 'verrou', 'pellicule', 'tisane', 'soufflet'];

function expectInvalid(payload: unknown, errorPattern: RegExp) {
  const result = validateFeedbackPayload(payload, ROUND_WORDS);
  expect(result.valid).toBe(false);
  if (!result.valid) {
    expect(result.error).toMatch(errorPattern);
  }
}

describe('validateFeedbackPayload', () => {
  it('accepts a full valid payload', () => {
    const result = validateFeedbackPayload(
      {
        rating: 4,
        comment: '  Très bonne énigme  ',
        flags: [
          { word: 'verrou', reason: 'too_obvious' },
          { word: 'tisane', reason: 'other', reasonText: 'hors sujet' },
        ],
      },
      ROUND_WORDS
    );

    expect(result).toEqual({
      valid: true,
      feedback: {
        rating: 4,
        comment: 'Très bonne énigme',
        flags: [
          { word: 'verrou', reason: 'too_obvious', reasonText: null },
          { word: 'tisane', reason: 'other', reasonText: 'hors sujet' },
        ],
      },
    });
  });

  it('accepts a rating-only payload', () => {
    const result = validateFeedbackPayload({ rating: 5 }, ROUND_WORDS);
    expect(result.valid).toBe(true);
  });

  it('rejects an empty payload', () => {
    expectInvalid({}, /empty/i);
    expectInvalid({ comment: '   ' }, /empty/i);
    expectInvalid(null, /invalid/i);
  });

  it('rejects out-of-range or non-integer ratings', () => {
    expectInvalid({ rating: 0 }, /between 1 and 5/);
    expectInvalid({ rating: 6 }, /between 1 and 5/);
    expectInvalid({ rating: 3.5 }, /between 1 and 5/);
    expectInvalid({ rating: 'great' }, /between 1 and 5/);
  });

  it('rejects flags on words that are not part of the round', () => {
    expectInvalid({ flags: [{ word: 'poison', reason: 'too_hard' }] }, /not part of this round/);
  });

  it('rejects unknown reasons', () => {
    expectInvalid({ flags: [{ word: 'verrou', reason: 'too_long' }] }, /invalid flag reason/i);
  });

  it("requires a description for the 'other' reason", () => {
    expectInvalid({ flags: [{ word: 'verrou', reason: 'other' }] }, /description is required/);
    expectInvalid({ flags: [{ word: 'verrou', reason: 'other', reasonText: '  ' }] }, /description is required/);
  });

  it('rejects duplicate word flags', () => {
    expectInvalid(
      {
        flags: [
          { word: 'verrou', reason: 'too_hard' },
          { word: 'verrou', reason: 'too_generic' },
        ],
      },
      /only be flagged once/
    );
  });

  it('rejects oversized comments', () => {
    expectInvalid({ comment: 'x'.repeat(MAX_COMMENT_LENGTH + 1) }, /at most/);
  });
});
