'use client';

import { useState, useEffect, Suspense } from 'react';
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

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill code from URL parameter and check for existing session
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setJoinCode(codeFromUrl.toUpperCase());
      checkExistingSession(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Check if user already has an active session in this room
  async function checkExistingSession(code: string) {
    try {
      // Get current session
      const sessionResponse = await fetch('/api/session/me');
      if (!sessionResponse.ok) {
        return; // No session, continue with join flow
      }

      const sessionData = await sessionResponse.json();
      
      // Get the session ID for this join code
      const joinCodeResponse = await fetch(`/api/sessions/by-code/${code}`);
      if (!joinCodeResponse.ok) {
        return; // Invalid code, let user proceed to see the error
      }

      const { sessionId } = await joinCodeResponse.json();
      
      // If user's session matches this room, redirect to lobby
      if (sessionData.sessionId === sessionId) {
        router.push(`/lobby/${sessionId}`);
      }
    } catch (err) {
      // Silently fail - let user proceed with join flow
      console.error('Error checking existing session:', err);
    }
  }

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
            🔍 Rejoindre une partie
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
                Code d'accès
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
              label="Votre nom"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Entrez votre nom"
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
              {loading ? 'Connexion...' : 'Rejoindre la partie'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <JoinContent />
    </Suspense>
  );
}
