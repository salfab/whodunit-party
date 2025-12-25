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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { validateMysteryFull } from '@/lib/mystery-validation';

interface MysteryData {
  title: string;
  description: string;
  image_path?: string;
  language: string;
  author?: string;
  theme?: string;
  innocent_words: string[];
  guilty_words: string[];
  character_sheets: Array<{
    role: 'investigator' | 'guilty' | 'innocent';
    character_name: string;
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
  const [isBase64, setIsBase64] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let jsonString = jsonInput;

      // Decode base64 if checkbox is checked
      if (isBase64) {
        try {
          jsonString = atob(jsonInput.trim());
        } catch (e) {
          throw new Error('Invalid base64 encoding');
        }
      }

      // Parse JSON
      const mysteriesData: MysteryData[] = JSON.parse(jsonString);

      if (!Array.isArray(mysteriesData)) {
        throw new Error('Input must be an array of mysteries');
      }

      // Validate each mystery against JSON schema and business rules
      for (const mystery of mysteriesData) {
        const validation = validateMysteryFull(mystery);
        if (!validation.valid) {
          throw new Error(
            `Validation failed for "${mystery.title || 'unknown'}": ${validation.errors?.join('; ')}`
          );
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
        router.push('/admin/mysteries');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload mysteries');
    } finally {
      setLoading(false);
    }
  };

  const exampleJson = `[
  {
    "title": "Murder at the Manor",
    "description": "## The Crime\\n\\nLord Blackwood was found dead in his study at midnight...",
    "innocent_words": ["manuscript", "inheritance", "betrayal"],
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
        "dark_secret": "You're having an affair with the victim's spouse.",
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
            description, innocent_words (3 words for all innocent players), guilty_words (3 words for the guilty player),
            and an array of character sheets with roles (investigator, guilty, innocent).
            Optionally check the box below if your JSON is base64-encoded.
          </Typography>

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

          <FormControlLabel
            control={
              <Checkbox
                checked={isBase64}
                onChange={(e) => setIsBase64(e.target.checked)}
              />
            }
            label="Input is Base64 encoded"
            sx={{ mb: 2 }}
          />

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
