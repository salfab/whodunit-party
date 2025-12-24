'use client';

import { useState } from 'react';
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

export default function CreateRoomPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();

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
          🔪 Create Game Room
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%' }} data-testid="error-message">
            {error}
          </Alert>
        )}

        {!gameCode ? (
          <Card sx={{ width: '100%', p: 2 }}>
            <CardContent>
              <Typography variant="body1" gutterBottom textAlign="center" sx={{ mb: 3 }}>
                Create a new game room and share the code with your friends
              </Typography>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={createRoom}
                disabled={loading}
                data-testid="generate-code-button"
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Room Code'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ width: '100%', p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom textAlign="center">
                Room Created Successfully! 🎉
              </Typography>

              <Box sx={{ my: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your Game Code:
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
                Share this code or scan the QR code to join
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={joinRoom}
                  data-testid="join-room-button"
                >
                  Join This Room
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  href="/"
                  data-testid="back-home-button"
                >
                  Back to Home
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
}
