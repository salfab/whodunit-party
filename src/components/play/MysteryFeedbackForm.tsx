'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Rating,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { WordFlagReason } from '@/lib/feedback-validation';

export interface MysteryFeedbackPayload {
  rating?: number;
  comment?: string;
  flags?: Array<{ word: string; reason: WordFlagReason; reasonText?: string }>;
}

interface MysteryFeedbackFormProps {
  words: string[];
  submitted: boolean;
  // eslint-disable-next-line no-unused-vars -- type-level parameter name, false positive of the base rule on TS
  onSubmit: (payload: MysteryFeedbackPayload) => Promise<void>;
}

const REASON_LABELS: Record<WordFlagReason, string> = {
  too_hard: 'Trop difficile',
  too_obvious: 'Trop évident',
  too_generic: 'Trop bateau',
  other: 'Autre',
};

interface WordFlagState {
  reason: WordFlagReason;
  reasonText: string;
}

export default function MysteryFeedbackForm({ words, submitted, onSubmit }: MysteryFeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [flags, setFlags] = useState<Map<string, WordFlagState>>(new Map());
  const [dismissed, setDismissed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleWord = (word: string) => {
    setFlags((prev) => {
      const next = new Map(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.set(word, { reason: 'too_obvious', reasonText: '' });
      }
      return next;
    });
  };

  const updateFlag = (word: string, update: Partial<WordFlagState>) => {
    setFlags((prev) => {
      const next = new Map(prev);
      const current = next.get(word);
      if (current) {
        next.set(word, { ...current, ...update });
      }
      return next;
    });
  };

  const flagsValid = [...flags.values()].every(
    (flag) => flag.reason !== 'other' || flag.reasonText.trim() !== ''
  );
  const isEmpty = rating === null && comment.trim() === '' && flags.size === 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        rating: rating ?? undefined,
        comment: comment.trim() || undefined,
        flags: [...flags.entries()].map(([word, flag]) => ({
          word,
          reason: flag.reason,
          reasonText: flag.reason === 'other' ? flag.reasonText.trim() : undefined,
        })),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Paper variant="outlined" sx={{ p: 3, mb: 4, textAlign: 'center' }} data-testid="feedback-thanks">
        <Typography variant="h6" sx={{ color: 'primary.main' }}>
          Merci pour votre retour !
        </Typography>
      </Paper>
    );
  }

  if (dismissed) {
    return (
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button size="small" onClick={() => setDismissed(false)} data-testid="feedback-reopen">
          Donner mon avis sur l&apos;énigme
        </Button>
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 4, position: 'relative' }} data-testid="feedback-form">
      <IconButton
        size="small"
        onClick={() => setDismissed(true)}
        sx={{ position: 'absolute', top: 8, right: 8 }}
        title="Passer"
        data-testid="feedback-skip"
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Votre avis sur cette énigme
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Facultatif — aidez-nous à améliorer les mystères et leurs mots.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography component="legend" variant="subtitle2" gutterBottom>
          Note de l&apos;énigme
        </Typography>
        <Rating
          value={rating}
          onChange={(_, value) => setRating(value)}
          size="large"
          data-testid="feedback-rating"
        />
      </Box>

      {words.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Les mots de cette manche — touchez ceux qui posaient problème
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }} data-testid="feedback-words">
            {words.map((word) => (
              <Chip
                key={word}
                label={word}
                variant={flags.has(word) ? 'filled' : 'outlined'}
                color={flags.has(word) ? 'warning' : 'default'}
                onClick={() => toggleWord(word)}
                data-testid={`feedback-word-${word}`}
              />
            ))}
          </Box>

          {[...flags.entries()].map(([word, flag]) => (
            <Box key={word} sx={{ mb: 2 }} data-testid={`feedback-flag-${word}`}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                « {word} » :
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={flag.reason}
                onChange={(_, reason) => {
                  if (reason) updateFlag(word, { reason });
                }}
                sx={{ flexWrap: 'wrap' }}
              >
                {(Object.keys(REASON_LABELS) as WordFlagReason[]).map((reason) => (
                  <ToggleButton key={reason} value={reason} data-testid={`feedback-reason-${word}-${reason}`}>
                    {REASON_LABELS[reason]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Collapse in={flag.reason === 'other'}>
                <TextField
                  fullWidth
                  size="small"
                  sx={{ mt: 1 }}
                  label="Quel était le problème ?"
                  value={flag.reasonText}
                  onChange={(e) => updateFlag(word, { reasonText: e.target.value })}
                  data-testid={`feedback-reason-text-${word}`}
                />
              </Collapse>
            </Box>
          ))}
        </Box>
      )}

      <TextField
        fullWidth
        multiline
        minRows={2}
        label="Une critique ou une remarque ? (facultatif)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ mb: 2 }}
        data-testid="feedback-comment"
      />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={() => setDismissed(true)} color="inherit">
          Passer
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isEmpty || !flagsValid || submitting}
          data-testid="feedback-submit"
        >
          Envoyer
        </Button>
      </Box>
    </Paper>
  );
}
