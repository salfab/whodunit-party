'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import AdminNavBar from '@/components/admin/AdminNavBar';

export default function CreateSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Échec de la création de la session');
      }

      // Redirect to admin dashboard
      router.push(`/admin/session/${data.sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <AdminNavBar 
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Créer une Session', href: null },
        ]}
      />
      
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            Créer une Nouvelle Partie
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleCreate}
              disabled={loading}
              sx={{ px: 6, py: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Créer une Session de Jeu'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
