'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';

interface MysteryData {
  title: string;
  description: string;
  image_path?: string;
  innocent_words: string[];
  guilty_words: string[];
  character_sheets: Array<{
    role: 'investigator' | 'guilty' | 'innocent';
    dark_secret: string;
    alibi: string;
    image_path?: string;
  }>;
}

export default function UploadMysteriesPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Parse JSON
      const mysteriesData: MysteryData[] = JSON.parse(jsonInput);

      if (!Array.isArray(mysteriesData)) {
        throw new Error('Input must be an array of mysteries');
      }

      // Validate structure
      for (const mystery of mysteriesData) {
        if (!mystery.title || !mystery.description) {
          throw new Error('Each mystery must have title and description');
        }

        if (!mystery.character_sheets || !Array.isArray(mystery.character_sheets)) {
          throw new Error('Each mystery must have character_sheets array');
        }

        const investigator = mystery.character_sheets.find((s) => s.role === 'investigator');
        const guilty = mystery.character_sheets.find((s) => s.role === 'guilty');

        if (!investigator || !guilty) {
          throw new Error(`Mystery "${mystery.title}" is missing investigator or guilty role`);
        }

        for (const sheet of mystery.character_sheets) {
          if (!sheet.role || !sheet.dark_secret || !sheet.alibi) {
            throw new Error('Each character sheet must have role, dark_secret, and alibi');
          }
        }

        if (!mystery.innocent_words || !Array.isArray(mystery.innocent_words) || mystery.innocent_words.length !== 3) {
          throw new Error(`Mystery "${mystery.title}" must have exactly 3 innocent_words`);
        }

        if (!mystery.guilty_words || !Array.isArray(mystery.guilty_words) || mystery.guilty_words.length !== 3) {
          throw new Error(`Mystery "${mystery.title}" must have exactly 3 guilty_words`);
        }
      }

      // Upload to API
      const response = await fetch('/api/mysteries/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mysteries: mysteriesData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload mysteries');
      }

      setSuccess(true);
      setJsonInput('');
      setTimeout(() => {
        router.push('/admin/session/create');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload mysteries');
    } finally {
      setLoading(false);
    }
  };

  coninnocent_words": ["manuscript", "inheritance", "betrayal"],
    "guilty_words": ["ledger", "poison", "desperate"],
    "character_sheets": [
      {
        "role": "investigator",
        "dark_secret": "You secretly gambled away your family fortune.",
        "alibi": "I was in the conservatory reading all evening."
      },
      {
        "role": "guilty",
        "dark_secret": "You poisoned the victim to prevent them from revealing your embezzlement.",
        "alibi": "I was in my room writing letters."
      },
      {
        "role": "innocent",
        "dark_secret": "You're having an affair with the victim's spouse."
      {
        "role": "innocent",
        "dark_secret": "You're having an affair with the victim's spouse.",
        "words_to_place": ["secret", "rendezvous", "passion"],
        "alibi": "I was walking in the garden."
      }
    ]
  }
]`;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Upload Mysteries
          </Typography>

          <Typography variant="body1" paragraph color="text.secondary">
            Paste a JSON array of mystery objects below. Each mystery should include a title,
            description, and an array of character sheets with roles (investigator, guilty, innocent).
          </Typography>innocent_words (3 words for all innocent players), guilty_words (3 words for the guilty player),
            

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Mysteries uploaded successfully! Redirecting...
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Example Format:
            </Typography>
            <Paper
              sx={{
                p: 2,
                bgcolor: 'background.default',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                overflow: 'auto',
                maxHeight: '300px',
              }}
            >
              <pre>{exampleJson}</pre>
            </Paper>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={15}
            label="JSON Input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON here..."
            sx={{ mb: 3, fontFamily: 'monospace' }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleUpload}
              disabled={loading || !jsonInput.trim()}
            >
              {loading ? <CircularProgress size={24} /> : 'Upload Mysteries'}
            </Button>

            <Button variant="outlined" size="large" onClick={() => router.back()}>
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
