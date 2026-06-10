export const WORD_FLAG_REASONS = ['too_hard', 'too_obvious', 'too_generic', 'other'] as const;
export type WordFlagReason = (typeof WORD_FLAG_REASONS)[number];

export const MAX_COMMENT_LENGTH = 2000;

export interface ValidatedWordFlag {
  word: string;
  reason: WordFlagReason;
  reasonText: string | null;
}

export interface ValidatedFeedback {
  rating: number | null;
  comment: string | null;
  flags: ValidatedWordFlag[];
}

export type FeedbackValidationResult =
  | { valid: true; feedback: ValidatedFeedback }
  | { valid: false; error: string };

/**
 * Validates an end-of-mystery feedback payload against the round's actual
 * words. Flagged words must belong to the 6 words drawn for the round, so the
 * word-quality analytics can't be polluted with arbitrary strings.
 */
export function validateFeedbackPayload(payload: unknown, roundWords: string[]): FeedbackValidationResult {
  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, error: 'Invalid feedback payload' };
  }

  const { rating, comment, flags } = payload as { rating?: unknown; comment?: unknown; flags?: unknown };

  let validatedRating: number | null = null;
  if (rating !== undefined && rating !== null) {
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { valid: false, error: 'Rating must be an integer between 1 and 5' };
    }
    validatedRating = rating;
  }

  let validatedComment: string | null = null;
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string') {
      return { valid: false, error: 'Comment must be a string' };
    }
    if (comment.length > MAX_COMMENT_LENGTH) {
      return { valid: false, error: `Comment must be at most ${MAX_COMMENT_LENGTH} characters` };
    }
    validatedComment = comment.trim() || null;
  }

  const validatedFlags: ValidatedWordFlag[] = [];
  if (flags !== undefined && flags !== null) {
    if (!Array.isArray(flags)) {
      return { valid: false, error: 'Flags must be an array' };
    }
    const knownWords = new Set(roundWords);
    const flaggedWords = new Set<string>();

    for (const flag of flags) {
      if (typeof flag !== 'object' || flag === null) {
        return { valid: false, error: 'Each flag must be an object' };
      }
      const { word, reason, reasonText } = flag as { word?: unknown; reason?: unknown; reasonText?: unknown };

      if (typeof word !== 'string' || !knownWords.has(word)) {
        return { valid: false, error: `Flagged word is not part of this round's words` };
      }
      if (flaggedWords.has(word)) {
        return { valid: false, error: 'Each word can only be flagged once' };
      }
      flaggedWords.add(word);

      if (typeof reason !== 'string' || !WORD_FLAG_REASONS.includes(reason as WordFlagReason)) {
        return { valid: false, error: 'Invalid flag reason' };
      }

      let validatedReasonText: string | null = null;
      if (reason === 'other') {
        if (typeof reasonText !== 'string' || !reasonText.trim()) {
          return { valid: false, error: `A description is required when the reason is 'other'` };
        }
        if (reasonText.length > MAX_COMMENT_LENGTH) {
          return { valid: false, error: `Flag description must be at most ${MAX_COMMENT_LENGTH} characters` };
        }
        validatedReasonText = reasonText.trim();
      }

      validatedFlags.push({ word, reason: reason as WordFlagReason, reasonText: validatedReasonText });
    }
  }

  if (validatedRating === null && validatedComment === null && validatedFlags.length === 0) {
    return { valid: false, error: 'Feedback is empty' };
  }

  return {
    valid: true,
    feedback: { rating: validatedRating, comment: validatedComment, flags: validatedFlags },
  };
}
