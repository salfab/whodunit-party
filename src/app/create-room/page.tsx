'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

export default function CreateRoomPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  // Auto-create room on page load and redirect to join page
  useEffect(() => {
    createRoom();
  }, []);

  const createRoom = async () => {
    setError('');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create game room');
      }

      const data = await response.json();
      // Redirect directly to join page with the code
      router.replace(`/join?code=${data.joinCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Typography variant="h2" component="h1" textAlign="center" data-testid="create-room-title">
            Créer une salle de jeu
          </Typography>
          <Alert severity="error" sx={{ width: '100%' }} data-testid="error-message">
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  return <LoadingScreen message="Création de la salle" />;
}
