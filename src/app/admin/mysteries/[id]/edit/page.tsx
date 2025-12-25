'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface CharacterSheet {
  role: 'investigator' | 'guilty' | 'innocent';
  character_name: string;
  dark_secret: string;
  alibi: string;
  image_path?: string;
}

interface MysteryFormData {
  title: string;
  description: string;
  image_path: string;
  innocent_words: [string, string, string];
  guilty_words: [string, string, string];
  character_sheets: CharacterSheet[];
}

export default function EditMysteryPage() {
  const router = useRouter();
  const params = useParams();
  const mysteryId = params?.id as string;
  const isNew = mysteryId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<MysteryFormData>({
    title: '',
    description: '',
    image_path: '',
    innocent_words: ['', '', ''],
    guilty_words: ['', '', ''],
    character_sheets: [
      { role: 'investigator', character_name: 'L\'Enquêteur', dark_secret: '', alibi: '' },
      { role: 'guilty', character_name: 'Le Coupable', dark_secret: '', alibi: '' },
      { role: 'innocent', character_name: 'Un Innocent', dark_secret: '', alibi: '' },
    ],
  });

  useEffect(() => {
    if (!isNew) {
      loadMystery();
    }
  }, [mysteryId, isNew]);

  const loadMystery = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/mysteries/${mysteryId}`);
      if (!response.ok) {
        throw new Error('Failed to load mystery');
      }
      const data = await response.json();
      setFormData({
        title: data.title || '',
        description: data.description || '',
        image_path: data.image_path || '',
        innocent_words: data.innocent_words || ['', '', ''],
        guilty_words: data.guilty_words || ['', '', ''],
        character_sheets: data.character_sheets || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load mystery');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (formData.innocent_words.some((w) => !w.trim())) {
        throw new Error('All 3 innocent words are required');
      }
      if (formData.guilty_words.some((w) => !w.trim())) {
        throw new Error('All 3 guilty words are required');
      }
      if (formData.character_sheets.length < 3) {
        throw new Error('At least 3 character sheets are required');
      }
      if (!formData.character_sheets.find((s) => s.role === 'investigator')) {
        throw new Error('Must have an investigator role');
      }
      if (!formData.character_sheets.find((s) => s.role === 'guilty')) {
        throw new Error('Must have a guilty role');
      }
      for (const sheet of formData.character_sheets) {
        if (!sheet.character_name.trim() || !sheet.dark_secret.trim() || !sheet.alibi.trim()) {
          throw new Error('All character sheets must have character_name, dark_secret and alibi');
        }
      }

      const url = isNew ? '/api/mysteries' : `/api/mysteries/${mysteryId}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save mystery');
      }

      router.push('/admin/mysteries');
    } catch (err: any) {
      setError(err.message || 'Failed to save mystery');
    } finally {
      setSaving(false);
    }
  };

  const updateInnocentWord = (index: number, value: string) => {
    const newWords = [...formData.innocent_words] as [string, string, string];
    newWords[index] = value;
    setFormData({ ...formData, innocent_words: newWords });
  };

  const updateGuiltyWord = (index: number, value: string) => {
    const newWords = [...formData.guilty_words] as [string, string, string];
    newWords[index] = value;
    setFormData({ ...formData, guilty_words: newWords });
  };

  const addCharacterSheet = () => {
    setFormData({
      ...formData,
      character_sheets: [
        ...formData.character_sheets,
        { role: 'innocent', character_name: 'Un Innocent', dark_secret: '', alibi: '' },
      ],
    });
  };

  const removeCharacterSheet = (index: number) => {
    setFormData({
      ...formData,
      character_sheets: formData.character_sheets.filter((_, i) => i !== index),
    });
  };

  const updateCharacterSheet = (index: number, field: keyof CharacterSheet, value: string) => {
    const newSheets = [...formData.character_sheets];
    newSheets[index] = { ...newSheets[index], [field]: value };
    setFormData({ ...formData, character_sheets: newSheets });
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {isNew ? 'Create New Mystery' : 'Edit Mystery'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Description (Markdown supported)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Image Path (optional)"
              value={formData.image_path}
              onChange={(e) => setFormData({ ...formData, image_path: e.target.value })}
            />
          </Box>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Innocent Words (3 required)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {formData.innocent_words.map((word, index) => (
              <TextField
                key={index}
                label={`Word ${index + 1}`}
                value={word}
                onChange={(e) => updateInnocentWord(index, e.target.value)}
                required
                sx={{ flex: 1 }}
              />
            ))}
          </Box>

          <Typography variant="h5" gutterBottom>
            Guilty Words (3 required)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {formData.guilty_words.map((word, index) => (
              <TextField
                key={index}
                label={`Word ${index + 1}`}
                value={word}
                onChange={(e) => updateGuiltyWord(index, e.target.value)}
                required
                sx={{ flex: 1 }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
            <Typography variant="h5">Character Sheets</Typography>
            <Button startIcon={<AddIcon />} onClick={addCharacterSheet}>
              Add Character
            </Button>
          </Box>

          {formData.character_sheets.map((sheet, index) => (
            <Paper key={index} sx={{ p: 3, mb: 2, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Character {index + 1}</Typography>
                {formData.character_sheets.length > 3 && (
                  <IconButton color="error" onClick={() => removeCharacterSheet(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Role"
                  value={sheet.role}
                  onChange={(e) =>
                    updateCharacterSheet(index, 'role', e.target.value as CharacterSheet['role'])
                  }
                  required
                >
                  <MenuItem value="investigator">Investigator</MenuItem>
                  <MenuItem value="guilty">Guilty</MenuItem>
                  <MenuItem value="innocent">Innocent</MenuItem>
                </TextField>

                <TextField
                  label="Character Name"
                  value={sheet.character_name}
                  onChange={(e) => updateCharacterSheet(index, 'character_name', e.target.value)}
                  required
                  helperText="The name of this character (e.g., 'Le Majordome', 'La Comtesse')"
                />

                <TextField
                  multiline
                  rows={3}
                  label="Dark Secret"
                  value={sheet.dark_secret}
                  onChange={(e) => updateCharacterSheet(index, 'dark_secret', e.target.value)}
                  required
                />

                <TextField
                  multiline
                  rows={3}
                  label="Alibi"
                  value={sheet.alibi}
                  onChange={(e) => updateCharacterSheet(index, 'alibi', e.target.value)}
                  required
                />

                <TextField
                  label="Image Path (optional)"
                  value={sheet.image_path || ''}
                  onChange={(e) => updateCharacterSheet(index, 'image_path', e.target.value)}
                />
              </Box>
            </Paper>
          ))}

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button variant="contained" size="large" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={24} /> : isNew ? 'Create Mystery' : 'Save Changes'}
            </Button>

            <Button variant="outlined" size="large" onClick={() => router.push('/admin/mysteries')}>
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
