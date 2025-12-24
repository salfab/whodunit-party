'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { usePlayerHeartbeat } from '@/hooks/usePlayerHeartbeat';
import type { Database } from '@/types/database';

type CharacterSheet = Database['public']['Tables']['character_sheets']['Row'];
type Player = Database['public']['Tables']['players']['Row'];
type Mystery = Database['public']['Tables']['mysteries']['Row'];

interface PlayerOption {
  id: string;
  name: string;
}

interface CharacterWithWords extends CharacterSheet {
  wordsToPlace: string[];
}

export default function PlayPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [currentPlayer, setCurrentPlayer] = useState<{ id: string; name: string } | null>(null);
  const [characterSheet, setCharacterSheet] = useState<CharacterWithWords | null>(null);
  const [isAccused, setIsAccused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [secretVisible, setSecretVisible] = useState(false);
  const [alibiVisible, setAlibiVisible] = useState(false);
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [accuseDialogOpen, setAccuseDialogOpen] = useState(false);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [accusationResult, setAccusationResult] = useState<{ wasCorrect: boolean; role: string } | null>(null);
  const [submittingAccusation, setSubmittingAccusation] = useState(false);

  const supabase = createClient();

  // Send heartbeats to keep player active
  usePlayerHeartbeat(currentPlayer?.id || null, true);

  useEffect(() => {
    loadCharacterSheet();
    setupRealtimeSubscription();
  }, [sessionId]);

  async function loadCharacterSheet() {
    try {
      // Get current player
      const response = await fetch('/api/session/me');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      const playerData = await response.json();
      setCurrentPlayer(playerData);

      // Get player assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('player_assignments')
        .select(`
          *,
          character_sheets (*)
        `)
        .eq('session_id', sessionId)
        .eq('player_id', playerData.playerId)
        .single();
Load all active players (for accusation list)
      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, name, status')
        .eq('session_id', sessionId)
        .eq('status', 'active');

      // Filter out the current player (investigator can't accuse themselves)
      const otherPlayers = allPlayers?.filter((p) => p.id !== playerData.playerId) || [];
      setPlayers(otherPlayers);

      // Check if player is accused
      const { data: playerStatus } = await supabase
        .from('players')
        .select('status')
        .eq('id', playerData.playerId)
        .single();

      setIsAccused(playerStatus?.status === 'accused');

      // Check if there's already an accusation
      const { data: existingRound } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (existingRound) {
        setAccusationResult({
          wasCorrect: existingRound.was_correct,
          role: existingRound.was_correct ? 'guilty' : 'innocent',
        });
      }
        .select('status')
        .eq('id', playerData.playerId)
        .single();

      setIsAccused(playerStatus?.status === 'accused');

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading character sheet:', err);
      setError(err.message || 'Failed to load character sheet');
      setLoading(false);
    }
  }

  function setupRealtimeSubscription() {
    // Subscribe to player status changes
    const channel = supabase
      .channel(`session-${sessionId}-players`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const updatedPlayer = payload.new as Player;
          if (updatedPlayer.id === currentPlayer?.id && updatedPlayer.status === 'accused') {
            setIsAccused(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  if (!characterSheet) {
    return (
      <Container maxWidth="md">svg`;
  };

  async function handleAccuse() {
    if (!selectedPlayer) return;

    setSubmittingAccusation(true);

    try {
      const response = await fetch('/api/rounds/submit-accusation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accusedPlayerId: selectedPlayer }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit accusation');
      }

      setAccusationResult({
        wasCorrect: data.wasCorrect,
        role: data.accusedRole,
      });

      setAccuseDialogOpen(false);
    } catch (err: any) {
      console.error('Error submitting accusation:', err);
      alert(err.message || 'Failed to submit accusation');
    } finally {
      setSubmittingAccusation(false);
    }
  }    <Box sx={{ py: 8 }}>
          <Alert severity="info">Waiting for game to start...</Alert>
        </Box>
      </Container>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'investigator':
        return 'primary';
      case 'guilty':
        return 'error';
      case 'innocent':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleImage = (role: string) => {
    if (characterSheet.image_path) {
      return characterSheet.image_path;
    }
    return `/characters/${role}.png`;
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4, minHeight: '100vh', position: 'relative' }}>
        {/* Blood drip overlay when accused */}
        <AnimatePresence>
          {isAccused && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, ease: 'easeIn' }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 1000,
                background: 'linear-gradient(180deg, rgba(139,0,0,0.3) 0%, rgba(139,0,0,0) 30%)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '10%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: '#8b0000',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  animation: 'drip 3s ease-in',
                }}
              >
                ACCUSED!
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Your Character Sheet
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Chip
                label={characterSheet.role.toUpperCase()}
                color={getRoleColor(characterSheet.role) as any}
                sx={{ fontSize: '1rem', px: 2, py: 3 }}
              />
              <IconButton 
                onClick={() => setRoleRevealed(!roleRevealed)}
                color={roleRevealed ? 'primary' : 'default'}
                sx={{ fontSize: '2rem' }}
              >
                {roleRevealed ? (
                  characterSheet.role === 'guilty' ? '😈' : '😇'
                ) : '❓'}
              </IconButton>
            </Box>
            {roleRevealed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {characterSheet.role === 'guilty' ? 'You are GUILTY' : 'You are INNOCENT'}
                </Typography>
              </motion.div>
            )}
          </Box>

          {/* Character Image */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img
              src={getRoleImage(characterSheet.role)}
              alt={characterSheet.role}
              style={{ maxWidth: '200px', borderRadius: '8px' }}
              onError={(e) => {
                // Fallback if image doesn't exist
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Box>

          {/* Dark Secret */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">🤫 Dark Secret</Typography>
              <IconButton onClick={() => setSecretVisible(!secretVisible)} size="small">
                {secretVisible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Box>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                bgcolor: 'background.default',
                minHeight: '80px',
                filter: secretVisible ? 'none' : 'blur(8px)',
                transition: 'filter 0.3s ease',
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {characterSheet.dark_secret}
              </ReactMarkdown>
            </Paper>
          </Box>

          {/* Words to Place */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              💬 Three Words to Place in Conversation
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {characterSheet.wordsToPlace.map((word, index) => (
                <Chip
                  key={index}
                  label={word}
                  variant="outlined"
                  sx={{ fontSize: '1rem', px: 2, py: 3 }}
                />
              ))}
            </Box>
          </Box>

          {/* Alibi */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">🕵️ Your Alibi</Typography>
              <IconButton onClick={() => setAlibiVisible(!alibiVisible)} size="small">
                {alibiVisible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Box>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                bgcolor: 'background.default',
                minHeight: '80px',
                filter: alibiVisible ? 'none' : 'blur(8px)',
                transition: 'filter 0.3s ease',
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {characterSheet.alibi}
              </ReactMarkdown>
            </Paper>
          </Box>

          {characterSheet.role === 'investigator' && !accusationResult && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                color="error"
                onClick={() => setAccuseDialogOpen(true)}
                sx={{ fontSize: '1.2rem', px: 4, py: 2 }}
              >
                J&apos;Accuse!
              </Button>
            </Box>
          )}

          {accusationResult && (
            <Alert
              severity={accusationResult.wasCorrect ? 'success' : 'error'}
              sx={{ mt: 4 }}
            >
              {accusationResult.wasCorrect
                ? '🎉 Correct! You found the guilty party!'
                : '❌ Wrong! You accused an innocent person.'}
            </Alert>
          )}

          <Alert severity="warning" sx={{ mt: 4 }}>
            ⚠️ Keep your character sheet secret from other players!
          </Alert>
        </Paper>

        {/* Accusation Dialog */}
        <Dialog
          open={accuseDialogOpen}
          onClose={() => !submittingAccusation && setAccuseDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Select the Guilty Party</DialogTitle>
          <DialogContent>
            <List>
              {players.map((player) => (
                <ListItem key={player.id} disablePadding>
                  <ListItemButton
                    selected={selectedPlayer === player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                  >
                    <Radio checked={selectedPlayer === player.id} />
                    <ListItemText primary={player.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAccuseDialogOpen(false)} disabled={submittingAccusation}>
              Cancel
            </Button>
            <Button
              onClick={handleAccuse}
              variant="contained"
              color="error"
              disabled={!selectedPlayer || submittingAccusation}
            >
              {submittingAccusation ? 'Accusing...' : 'Accuse'}
            </Button>
          </DialogActions>
        </Dialogper
              elevation={1}
              sx={{
                p: 2,
                bgcolor: 'background.default',
                minHeight: '80px',
                filter: alibiVisible ? 'none' : 'blur(8px)',
                transition: 'filter 0.3s ease',
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {characterSheet.alibi}
              </ReactMarkdown>
            </Paper>
          </Box>

          {characterSheet.role === 'investigator' && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                color="error"
                sx={{ fontSize: '1.2rem', px: 4, py: 2 }}
              >
                J&apos;Accuse!
              </Button>
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 4 }}>
            ⚠️ Keep your character sheet secret from other players!
          </Alert>
        </Paper>
      </Box>

      <style jsx global>{`
        @keyframes drip {
          0% {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(0);
            opacity: 0.8;
          }
        }
      `}</style>
    </Container>
  );
}
