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
import { motion } from 'framer-motion';
import OtpInput from '@/components/OtpInput';
import LoadingScreen from '@/components/LoadingScreen';
import TakeoverDialog from '@/components/TakeoverDialog';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTakeoverDialog, setShowTakeoverDialog] = useState(false);
  const [takeoverLoading, setTakeoverLoading] = useState(false);
  const [wasKicked, setWasKicked] = useState(false);

  // Pre-fill code from URL parameter and check for existing session
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    const kicked = searchParams.get('kicked');
    
    if (kicked === 'true') {
      setWasKicked(true);
    }
    
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
        // Handle name already taken - show takeover dialog
        if (response.status === 409 && data.error === 'NAME_TAKEN') {
          setShowTakeoverDialog(true);
          setLoading(false);
          return;
        }
        
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

  const handleTakeover = async () => {
    setTakeoverLoading(true);
    setError('');

    try {
      const response = await fetch('/api/join/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode: joinCode.trim().toUpperCase(),
          playerName: playerName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to takeover session');
        setShowTakeoverDialog(false);
        setTakeoverLoading(false);
        return;
      }

      // Check if player has an active assignment
      if (data.hasActiveAssignment) {
        // Redirect directly to play page
        router.push(`/play/${data.sessionId}`);
      } else {
        // Redirect to lobby
        router.push(`/lobby/${data.sessionId}`);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setShowTakeoverDialog(false);
      setTakeoverLoading(false);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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

          {wasKicked && (
            <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setWasKicked(false)} data-testid="kicked-player-alert">
              Vous avez été retiré de la partie. Vous pouvez rejoindre à nouveau.
            </Alert>
          )}

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
                maxLength: 15,
                'data-testid': 'player-name-input',
              }}
              helperText={`${playerName.length}/15 caractères`}
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
        </motion.div>

        <TakeoverDialog
          open={showTakeoverDialog}
          playerName={playerName}
          onConfirm={handleTakeover}
          onCancel={() => setShowTakeoverDialog(false)}
          loading={takeoverLoading}
        />
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
