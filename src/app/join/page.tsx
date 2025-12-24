'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  FormLabel,
} from '@mui/material';
import OtpInput from '@/components/OtpInput';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill code from URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setJoinCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode: joinCode.trim().toUpperCase(),
          playerName: playerName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to join game');
        setLoading(false);
        return;
      }

      // Redirect to lobby
      router.push(`/lobby/${data.sessionId}`);
    } catch (err) {
      setError('Failed to connect to server');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
          }}
          data-testid="join-form-container"
        >
          <Typography variant="h4" component="h1" gutterBottom textAlign="center" data-testid="join-page-title">
            🔍 Join Game
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="join-error-message">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleJoin} sx={{ mt: 3 }}>
            <Box sx={{ mb: 4 }}>
              <FormLabel
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  mb: 2,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Game Code
              </FormLabel>
              <OtpInput
                length={6}
                value={joinCode}
                onChange={setJoinCode}
                disabled={loading}
                data-testid="game-code-input-container"
              />
            </Box>

            <TextField
              fullWidth
              label="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
              sx={{ mb: 3 }}
              inputProps={{
                maxLength: 30,
                'data-testid': 'player-name-input',
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading || !joinCode || !playerName}
              data-testid="submit-join-button"
            >
              {loading ? 'Joining...' : 'Join Game'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
