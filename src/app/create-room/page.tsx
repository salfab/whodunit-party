'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LoadingScreen from '@/components/LoadingScreen';

export default function CreateRoomPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();

  // Auto-create room on page load
  useEffect(() => {
    createRoom();
  }, []);

  const createRoom = async () => {
    setLoading(true);
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
      setGameCode(data.joinCode);
      setSessionId(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (gameCode) {
      router.push(`/join?code=${gameCode}`);
    }
  };

  const roomUrl = gameCode
    ? `${window.location.origin}/join?code=${gameCode}`
    : '';

  if (loading) {
    return <LoadingScreen message="Création de la salle" />;
  }

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
          🔪 Créer une salle de jeu
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%' }} data-testid="error-message">
            {error}
          </Alert>
        )}

        {gameCode ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ width: '100%', p: 2 }}>
              <CardContent>
              <Typography variant="h6" gutterBottom textAlign="center">
                Salle créée avec succès ! 🎉
              </Typography>

              <Box sx={{ my: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Votre code d'accès :
                </Typography>
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    fontFamily: 'monospace',
                    letterSpacing: 4,
                    color: 'secondary.main',
                    my: 2,
                  }}
                  data-testid="game-code-display"
                >
                  {gameCode}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  my: 3,
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                }}
                data-testid="qr-code-container"
              >
                <QRCodeSVG value={roomUrl} size={200} level="H" />
              </Box>

              <Typography variant="body2" textAlign="center" sx={{ mb: 3 }}>
                Partagez ce code ou scannez le QR code pour rejoindre
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={joinRoom}
                  data-testid="join-room-button"
                >
                  Rejoindre cette salle
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  href="/"
                  data-testid="back-home-button"
                >
                  Retour à l'accueil
                </Button>
              </Box>
            </CardContent>
          </Card>
          </motion.div>
        ) : null}
      </Box>
    </Container>
  );
}
