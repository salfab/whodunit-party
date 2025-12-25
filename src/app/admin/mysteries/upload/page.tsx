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
  Tabs,
  Tab,
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UploadMysteriesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
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

  const exampleJson = `[
  {
    "title": "Murder at the Manor",
    "description": "## The Crime\\n\\nLord Blackwood was found dead...",
    "language": "en",
    "author": "Mystery Author",
    "theme": "SERIOUS_MURDER",
    "innocent_words": ["manuscript", "inheritance", "betrayal"],
    "guilty_words": ["ledger", "poison", "desperate"],
    "character_sheets": [
      {
        "role": "investigator",
        "character_name": "Detective Holmes",
        "dark_secret": "You secretly gambled away your family fortune.",
        "alibi": "I was in the conservatory reading all evening."
      },
      {
        "role": "guilty",
        "character_name": "Lord Blackwood Jr.",
        "dark_secret": "You poisoned the victim to prevent...",
        "alibi": "I was in my room writing letters."
      },
      {
        "role": "innocent",
        "character_name": "Lady Sinclair",
        "dark_secret": "You're having an affair with...",
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab icon={<CloudUpload />} label="Zip Package" iconPosition="start" />
            <Tab icon={<Code />} label="JSON Input" iconPosition="start" />
          </Tabs>

          <Divider />

          {/* ZIP UPLOAD TAB */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="body1" paragraph color="text.secondary">
              Upload a .zip file containing a <code>mystery.json</code> and optional images.
              Images should be in an <code>images/</code> folder and referenced in the JSON.
            </Typography>

            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: 'background.default',
                border: '2px dashed',
                borderColor: selectedFile ? 'success.main' : 'divider',
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
              />
              <label htmlFor="zip-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  size="large"
                >
                  Select Zip File
                </Button>
              </label>

              {selectedFile && (
                <Typography sx={{ mt: 2 }} color="success.main">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Paper>

            <Typography variant="subtitle2" gutterBottom>
              Expected zip structure:
            </Typography>
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              <pre style={{ margin: 0 }}>{`mystery-pack.zip
├── mystery.json
└── images/
    ├── cover.jpg
    ├── character1.jpg
    └── character2.jpg`}</pre>
            </Paper>

            <Button
              variant="contained"
              size="large"
              onClick={handleZipUpload}
              disabled={loading || !selectedFile}
              startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              {loading ? 'Uploading...' : 'Upload Mystery Pack'}
            </Button>
          </TabPanel>

          {/* JSON INPUT TAB */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="body1" paragraph color="text.secondary">
              Paste a JSON array of mystery objects. Each mystery should include title, description,
              language, author, theme, words, and character sheets. Images are not supported in this mode.
            </Typography>

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
              <Typography variant="subtitle2" gutterBottom>
                Example Format:
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}
              >
                <pre style={{ margin: 0 }}>{exampleJson}</pre>
              </Paper>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={12}
              label="JSON Input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON here..."
              sx={{ mb: 3, fontFamily: 'monospace' }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleJsonUpload}
              disabled={loading || !jsonInput.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <Code />}
            >
              {loading ? 'Uploading...' : 'Upload JSON'}
            </Button>
          </TabPanel>

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
