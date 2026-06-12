'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  FormLabel,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion } from 'framer-motion';
import OtpInput from '@/components/OtpInput';
import TakeoverDialog from '@/components/TakeoverDialog';
import LoadingScreen from '@/components/LoadingScreen';
import { DecoFrame } from '@/components/shared/DecoFrame';
import { DecoPediment } from '@/components/shared/DecoPediment';

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
  const [joinCodeValidationState, setJoinCodeValidationState] = useState<
    'idle' | 'validating' | 'valid' | 'invalid'
  >('idle');
  const [joinCodeValidationMessage, setJoinCodeValidationMessage] = useState('');
  const prefilledJoinCode = searchParams.get('code')?.trim().toUpperCase() ?? '';
  const hasPrefilledJoinCode = prefilledJoinCode.length > 0;
  const effectiveJoinCode = hasPrefilledJoinCode ? prefilledJoinCode : joinCode;
  const isJoinCodeComplete = effectiveJoinCode.trim().length === 6;
  const isJoinCodeValidating = !hasPrefilledJoinCode && joinCodeValidationState === 'validating';

  // Pre-fill code from URL parameter and check for existing session
  useEffect(() => {
    const kicked = searchParams.get('kicked');
    
    if (kicked === 'true') {
      setWasKicked(true);
    }
    
    if (hasPrefilledJoinCode) {
      checkExistingSession(prefilledJoinCode);
    }
  }, [searchParams, hasPrefilledJoinCode, prefilledJoinCode]);

  // Validate manual join code as soon as all 6 characters are entered
  useEffect(() => {
    if (hasPrefilledJoinCode) {
      return;
    }

    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinCodeValidationState('idle');
      setJoinCodeValidationMessage('');
      return;
    }

    let cancelled = false;
    setJoinCodeValidationState('validating');
    setJoinCodeValidationMessage('');

    const validateCode = async () => {
      try {
        const response = await fetch(`/api/sessions/by-code/${code}`);
        if (cancelled) return;

        if (response.ok) {
          setJoinCodeValidationState('valid');
          setJoinCodeValidationMessage('Code valide');
        } else {
          setJoinCodeValidationState('invalid');
          setJoinCodeValidationMessage('Code invalide, essayez un autre code');
        }
      } catch {
        if (cancelled) return;
        setJoinCodeValidationState('invalid');
        setJoinCodeValidationMessage('Validation impossible, reessayez');
      }
    };

    validateCode();

    return () => {
      cancelled = true;
    };
  }, [joinCode, hasPrefilledJoinCode]);

  const handleResetValidatedCode = () => {
    setJoinCode('');
    setJoinCodeValidationState('idle');
    setJoinCodeValidationMessage('');
    setError('');
  };

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
          joinCode: effectiveJoinCode.trim().toUpperCase(),
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
    } catch {
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
          joinCode: effectiveJoinCode.trim().toUpperCase(),
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
    } catch {
      setError('Failed to connect to server');
      setShowTakeoverDialog(false);
      setTakeoverLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" disableGutters>
      <Box
        sx={{
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 1.25, sm: 2 },
          py: { xs: 2, sm: 4 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            component="section"
            sx={{
              pt: { xs: 5, sm: 5.4 },
              px: { xs: 3.25, sm: 3.75 },
              pb: { xs: 6, sm: 6.5 },
              borderRadius: 0,
              position: 'relative',
              overflow: 'hidden',
              bgcolor: 'rgba(16, 17, 21, 0.84)',
              border: 0,
              backgroundImage:
                'linear-gradient(180deg, rgba(184, 150, 95, 0.11), transparent 28%), linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent 42%)',
              boxShadow: '0 26px 86px rgba(0, 0, 0, 0.52), inset 0 0 70px rgba(0, 0, 0, 0.28)',
              backdropFilter: 'blur(8px)',
            }}
            data-testid="join-form-container"
          >
            <DecoFrame />
          <Box sx={{ position: 'relative', zIndex: 1, mb: { xs: 1.65, sm: 2 }, textAlign: 'center' }}>
            <DecoPediment sx={{ mb: 0.6 }} />
            <Typography
              component="div"
              sx={{
                fontFamily: '"Lobby Deco Display", "Bodoni MT Condensed", "Bodoni MT", serif',
                fontSize: { xs: '1.38rem', sm: '1.7rem' },
                fontWeight: 700,
                letterSpacing: { xs: '0.045em', sm: '0.06em' },
                lineHeight: 0.95,
                textTransform: 'uppercase',
                color: 'secondary.light',
                textShadow: '0 5px 18px rgba(0, 0, 0, 0.65)',
                transform: 'scaleX(0.92)',
                transformOrigin: 'center',
              }}
            >
              Faux Témoignage
            </Typography>
          </Box>

          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'minmax(30px, 1fr) auto minmax(30px, 1fr)',
              alignItems: 'center',
              gap: { xs: 0.7, sm: 1 },
              mb: { xs: 2.35, sm: 2.75 },
            }}
          >
            <Box sx={{ height: '1px', bgcolor: 'rgba(184, 150, 95, 0.35)' }} />
            <Typography
              variant="h4"
              component="h1"
              textAlign="center"
              data-testid="join-page-title"
              sx={{
                fontFamily: '"Bahnschrift Condensed", "Bahnschrift SemiCondensed", "Bahnschrift", "Aptos Display", "Segoe UI", sans-serif',
                fontSize: { xs: '1.38rem', sm: '1.7rem' },
                fontWeight: 800,
                letterSpacing: { xs: '0.04em', sm: '0.06em' },
                lineHeight: 1,
                textTransform: 'uppercase',
                color: '#efe5cf',
                textShadow: '0 6px 18px rgba(0, 0, 0, 0.62)',
                whiteSpace: 'nowrap',
              }}
            >
              Rejoindre une partie
            </Typography>
            <Box sx={{ height: '1px', bgcolor: 'rgba(184, 150, 95, 0.35)' }} />
          </Box>

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

          <Box component="form" onSubmit={handleJoin} sx={{ position: 'relative', zIndex: 1 }}>
            {!hasPrefilledJoinCode && <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                <FormLabel
                  sx={{
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'secondary.main',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  }}
                >
                  Code d'accès
                </FormLabel>
                {joinCodeValidationState === 'validating' && <CircularProgress size={16} data-testid="join-code-validating-spinner" />}
                {joinCodeValidationState === 'valid' && (
                  <Tooltip title="Modifier le code">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={handleResetValidatedCode}
                      aria-label="Modifier le code valide"
                      data-testid="join-code-validated-tick"
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <OtpInput
                length={6}
                value={joinCode}
                onChange={setJoinCode}
                disabled={loading || joinCodeValidationState === 'validating' || joinCodeValidationState === 'valid'}
                data-testid="game-code-input-container"
              />
              {joinCodeValidationMessage && (
                <Typography
                  variant="caption"
                  display="block"
                  textAlign="center"
                  sx={{
                    mt: 1,
                    color: joinCodeValidationState === 'valid' ? 'success.main' : 'error.main',
                  }}
                  data-testid="join-code-validation-message"
                >
                  {joinCodeValidationMessage}
                </Typography>
              )}
            </Box>}

            <TextField
              fullWidth
              label="Votre nom"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Entrez votre nom"
              required
              sx={{
                mb: 3,
                '& .MuiFormHelperText-root': {
                  mx: 0,
                  color: 'text.secondary',
                },
              }}
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
              disabled={loading || !isJoinCodeComplete || !playerName || isJoinCodeValidating}
              data-testid="submit-join-button"
              sx={{ minHeight: 52 }}
            >
              {loading ? 'Connexion...' : 'Rejoindre la partie'}
            </Button>
          </Box>
        </Box>
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
    <Suspense fallback={<LoadingScreen message="Chargement" />}>
      <JoinContent />
    </Suspense>
  );
}

