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
import AdminNavBar from '@/components/admin/AdminNavBar';

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
    occupation?: string;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [currentUpload, setCurrentUpload] = useState<{ file: File; progress: string } | null>(null);
  const [completedUploads, setCompletedUploads] = useState<Array<{ file: string; success: boolean; message: string }>>([]);
  
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
          throw new Error('Encodage base64 invalide');
        }
      }

      // Parse JSON
      const mysteriesData: MysteryData[] = JSON.parse(jsonString);

      if (!Array.isArray(mysteriesData)) {
        throw new Error('L\'entrée doit être un tableau de mystères');
      }

      // Validate each mystery against JSON schema and business rules
      for (const mystery of mysteriesData) {
        const validation = validateMysteryFull(mystery);
        if (!validation.valid) {
          throw new Error(
            `Échec de la validation pour "${mystery.title || 'inconnu'}": ${validation.errors?.join('; ')}`
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
        throw new Error(data.error || 'Échec du téléchargement des mystères');
      }

      setSuccess(`Téléchargement réussi de ${mysteriesData.length} mystère(s) !`);
      setJsonInput('');
      setTimeout(() => {
        router.push('/admin/mysteries');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Échec du téléchargement des mystères');
    } finally {
      setLoading(false);
    }
  };

  const handleZipUpload = async () => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setCompletedUploads([]);
    setUploadQueue([...selectedFiles]);

    const results: Array<{ file: string; success: boolean; message: string }> = [];

    // Process files one by one
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCurrentUpload({ file, progress: `${i + 1}/${selectedFiles.length}` });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/mysteries/upload-pack', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.details || data.error || 'Échec du téléchargement du paquet mystère');
        }

        const totalImages = data.mysteries.reduce((sum: number, m: any) => sum + (m.imagesUploaded || 0), 0);
        
        let message = '';
        if (data.count === 1) {
          message = `"${data.mysteries[0].title}" - ${data.mysteries[0].imagesUploaded} images`;
        } else {
          message = `${data.count} mystères - ${totalImages} images`;
        }

        results.push({ file: file.name, success: true, message });
        setCompletedUploads([...results]);
      } catch (err: any) {
        results.push({ 
          file: file.name, 
          success: false, 
          message: err.message || 'Échec du téléchargement' 
        });
        setCompletedUploads([...results]);
      }

      // Remove from queue
      setUploadQueue(prev => prev.slice(1));
    }

    setCurrentUpload(null);
    setLoading(false);
    
    // Check if all succeeded
    const allSucceeded = results.every(u => u.success);
    if (allSucceeded) {
      setSuccess(`Téléchargement réussi de tous les ${selectedFiles.length} fichier(s) !`);
      setTimeout(() => {
        router.push('/admin/mysteries');
      }, 2000);
    } else {
      setError('Certains téléchargements ont échoué. Vérifiez les résultats ci-dessous.');
    }
    
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const zipFiles = files.filter(f => f.name.endsWith('.zip'));
    
    if (zipFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier .zip');
      return;
    }

    if (zipFiles.length !== files.length) {
      setError('Tous les fichiers doivent être des fichiers .zip');
      return;
    }

    setSelectedFiles(zipFiles);
    setError('');
    setCompletedUploads([]);
  };

  return (
    <Container maxWidth="lg">
      <AdminNavBar 
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Mystères', href: '/admin/mysteries' },
          { label: 'Télécharger', href: null },
        ]}
      />
      
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom data-testid="upload-page-title">
            Télécharger des Mystères
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
              <CloudUpload color="primary" /> Télécharger un Paquet Zip
            </Typography>
            <Typography variant="body2" paragraph color="text.secondary">
              Téléchargez un ou plusieurs fichiers .zip contenant <code>mystery.json</code> + un dossier d'images. Idéal pour les mystères avec portraits de personnages.
            </Typography>

            <Box
              sx={{
                p: 3,
                mb: 2,
                border: '2px dashed',
                borderColor: selectedFiles.length > 0 ? 'success.main' : 'divider',
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
                multiple
                data-testid="upload-zip-input"
              />
              <label htmlFor="zip-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  data-testid="upload-zip-select-button"
                >
                  Sélectionner des Fichiers Zip
                </Button>
              </label>

              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="success.main" variant="body2" gutterBottom>
                    ✓ {selectedFiles.length} fichier(s) sélectionné(s)
                  </Typography>
                  <Box sx={{ maxHeight: '150px', overflow: 'auto', textAlign: 'left', px: 2 }}>
                    {selectedFiles.map((file, idx) => (
                      <Typography key={idx} variant="caption" component="div" sx={{ fontFamily: 'monospace' }}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {currentUpload && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Téléchargement en cours : {currentUpload.file.name} ({currentUpload.progress})
              </Alert>
            )}

            {completedUploads.length > 0 && (
              <Box sx={{ mb: 2, maxHeight: '200px', overflow: 'auto' }}>
                {completedUploads.map((upload, idx) => (
                  <Alert key={idx} severity={upload.success ? 'success' : 'error'} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{upload.file}:</strong> {upload.message}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 2, fontFamily: 'monospace' }}>
              Format attendu : mystery.json + images/*.jpg
            </Typography>

            <Button
              variant="contained"
              onClick={handleZipUpload}
              disabled={loading || selectedFiles.length === 0}
              startIcon={loading ? <CircularProgress size={18} /> : <CloudUpload />}
              data-testid="upload-zip-button"
            >
              {loading ? `Téléchargement... (${uploadQueue.length} restant(s))` : `Télécharger ${selectedFiles.length || 0} Fichier(s)`}
            </Button>
          </Paper>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">OU</Typography>
          </Divider>

          {/* JSON INPUT SECTION */}
          <Paper sx={{ p: 3, bgcolor: 'background.default' }} data-testid="upload-json-section">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Code color="primary" /> Saisie JSON
            </Typography>
            <Typography variant="body2" paragraph color="text.secondary">
              Collez un tableau JSON de mystères. Pas de support d'images dans ce mode.
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={isBase64}
                  onChange={(e) => setIsBase64(e.target.checked)}
                  size="small"
                />
              }
              label="Encodé en Base64"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={10}
              label="Tableau JSON"
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
              {loading ? 'Téléchargement...' : 'Télécharger JSON'}
            </Button>
          </Paper>

          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button variant="outlined" onClick={() => router.push('/admin/mysteries')}>
              Annuler
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
