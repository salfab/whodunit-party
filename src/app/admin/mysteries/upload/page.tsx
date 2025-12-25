'use client';

import { useState, useRef } from 'react';
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
  Divider,
} from '@mui/material';
import { CloudUpload, Code } from '@mui/icons-material';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // JSON upload state
  const [jsonInput, setJsonInput] = useState('');
  const [isBase64, setIsBase64] = useState(false);
  
  // Zip upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleJsonUpload = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

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

      setSuccess(`Successfully uploaded ${mysteriesData.length} mystery(ies)!`);
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

  const handleZipUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/mysteries/upload-pack', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to upload mystery pack');
      }

      setSuccess(`Successfully uploaded "${data.mystery.title}" with ${data.imagesUploaded} images!`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => {
        router.push('/admin/mysteries');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload mystery pack');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        setError('Please select a .zip file');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom data-testid="upload-page-title">
            Upload Mysteries
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')} data-testid="upload-error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} data-testid="upload-success">
              {success}
            </Alert>
          )}

          {/* ZIP UPLOAD SECTION */}
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.default' }} data-testid="upload-zip-section">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUpload color="primary" /> Zip Package Upload
            </Typography>
            <Typography variant="body2" paragraph color="text.secondary">
              Upload a .zip file containing <code>mystery.json</code> + images folder. Best for mysteries with character portraits.
            </Typography>

            <Box
              sx={{
                p: 3,
                mb: 2,
                border: '2px dashed',
                borderColor: selectedFile ? 'success.main' : 'divider',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <input
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
                id="zip-upload"
                data-testid="upload-zip-input"
              />
              <label htmlFor="zip-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  data-testid="upload-zip-select-button"
                >
                  Select Zip File
                </Button>
              </label>

              {selectedFile && (
                <Typography sx={{ mt: 1 }} color="success.main" variant="body2" data-testid="upload-zip-selected-file">
                  ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>

            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 2, fontFamily: 'monospace' }}>
              Expected: mystery.json + images/*.jpg
            </Typography>

            <Button
              variant="contained"
              onClick={handleZipUpload}
              disabled={loading || !selectedFile}
              startIcon={loading ? <CircularProgress size={18} /> : <CloudUpload />}
              data-testid="upload-zip-button"
            >
              {loading ? 'Uploading...' : 'Upload Zip'}
            </Button>
          </Paper>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">OR</Typography>
          </Divider>

          {/* JSON INPUT SECTION */}
          <Paper sx={{ p: 3, bgcolor: 'background.default' }} data-testid="upload-json-section">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Code color="primary" /> JSON Input
            </Typography>
            <Typography variant="body2" paragraph color="text.secondary">
              Paste JSON array of mysteries. No image support in this mode.
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={isBase64}
                  onChange={(e) => setIsBase64(e.target.checked)}
                  size="small"
                />
              }
              label="Base64 encoded"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={10}
              label="JSON Array"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{ "title": "...", "description": "...", ... }]'
              sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}
              data-testid="upload-json-input"
            />

            <Button
              variant="contained"
              onClick={handleJsonUpload}
              disabled={loading || !jsonInput.trim()}
              startIcon={loading ? <CircularProgress size={18} /> : <Code />}
              data-testid="upload-json-button"
            >
              {loading ? 'Uploading...' : 'Upload JSON'}
            </Button>
          </Paper>

          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button variant="outlined" onClick={() => router.back()}>
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
