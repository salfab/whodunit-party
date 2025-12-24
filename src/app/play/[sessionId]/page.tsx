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
  Snackbar,
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

interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

interface AvailableMystery {
  id: string;
  title: string;
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
  const [accusationResult, setAccusationResult] = useState<{ wasCorrect: boolean; role: string; gameComplete: boolean; message: string } | null>(null);
  const [submittingAccusation, setSubmittingAccusation] = useState(false);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [availableMysteries, setAvailableMysteries] = useState<AvailableMystery[]>([]);
  const [selectedMystery, setSelectedMystery] = useState<string>('');
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [startingNextRound, setStartingNextRound] = useState(false);
  const [errorSnackbar, setErrorSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const supabase = createClient();

  // Send heartbeats to keep player active
  usePlayerHeartbeat(currentPlayer?.id || null, true);

  useEffect(() => {
    loadCharacterSheet();
    setupRealtimeSubscription();
  }, [sessionId]);

  useEffect(() => {
    if (accusationResult && !accusationResult.gameComplete) {
      // Load scoreboard and available mysteries for voting
      loadScoreboard();
      loadAvailableMysteries();
      setupVoteSubscription();
    }
  }, [accusationResult]);

  async function loadCharacterSheet() {
    try {
      // Get current player
      const response = await fetch('/api/session/me');
      if (!response.ok) {
        // User is not authenticated, fetch session to get join code and redirect
        const { data: sessionData } = await supabase
          .from('game_sessions')
          .select('join_code')
          .eq('id', sessionId)
          .single();
        
        if (sessionData?.join_code) {
          window.location.href = `/join?code=${sessionData.join_code}`;
          return;
        }
        throw new Error('Not authenticated');
      }
      const playerData = await response.json();
      setCurrentPlayer(playerData);

      // Get player assignment (with retry in case assignments are still being created)
      let assignment = null;
      let assignmentError = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!assignment && attempts < maxAttempts) {
        const result = await supabase
          .from('player_assignments')
          .select(`
            *,
            character_sheets (
              *,
              mysteries (*)
            )
          `)
          .eq('session_id', sessionId)
          .eq('player_id', playerData.playerId)
          .single();

        assignment = result.data;
        assignmentError = result.error;

        if (!assignment && attempts < maxAttempts - 1) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
          console.log(`Retrying assignment fetch (attempt ${attempts + 1}/${maxAttempts})...`);
        } else {
          break;
        }
      }

      if (assignmentError || !assignment) {
        throw new Error('No character sheet assigned yet');
      }

      const sheet = assignment.character_sheets;
      const mystery = sheet.mysteries;
      
      // Add the words to place based on role (only for guilty/innocent)
      const wordsToPlace = sheet.role === 'investigator' ? [] : 
        (sheet.role === 'guilty' ? mystery.guilty_words : mystery.innocent_words);
      
      setCharacterSheet({ ...sheet, wordsToPlace, mystery });

      // Load all active players (for accusation list)
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

      // Check if there's already an accusation (ignore errors if table doesn't exist or no data)
      const { data: existingRound, error: roundError } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!roundError && existingRound) {
        setAccusationResult({
          wasCorrect: existingRound.was_correct,
          role: existingRound.was_correct ? 'guilty' : 'innocent',
        });
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading character sheet:', err);
      setError(err.message || 'Failed to load character sheet');
      setLoading(false);
    }
  }
  async function loadScoreboard() {
    try {
      const { data: allPlayers, error } = await supabase
        .from('players')
        .select('id, name, score')
        .eq('session_id', sessionId)
        .in('status', ['active', 'accused'])
        .order('score', { ascending: false });

      if (error) {
        console.error('Error loading scoreboard:', error);
        return;
      }

      setPlayerScores(allPlayers || []);
    } catch (err) {
      console.error('Error loading scoreboard:', err);
    }
  }

  async function loadAvailableMysteries() {
    try {
      // Get all mysteries
      const mysteriesResponse = await fetch('/api/mysteries');
      if (!mysteriesResponse.ok) {
        throw new Error('Failed to fetch mysteries');
      }
      const allMysteries = await mysteriesResponse.json();

      // Get played mysteries
      const { data: rounds, error } = await supabase
        .from('rounds')
        .select('mystery_id')
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error fetching played mysteries:', error);
        setAvailableMysteries(allMysteries);
        return;
      }

      const playedIds = new Set(rounds?.map((r) => r.mystery_id) || []);
      const available = allMysteries.filter((m: any) => !playedIds.has(m.id));

      setAvailableMysteries(available);

      // Load current vote counts
      const tallyResponse = await fetch(`/api/sessions/${sessionId}/tally-votes`);
      if (tallyResponse.ok) {
        const { voteCounts: currentVotes } = await tallyResponse.json();
        setVoteCounts(currentVotes || {});
      }
    } catch (err) {
      console.error('Error loading available mysteries:', err);
    }
  }

  async function handleVoteForMystery(mysteryId: string) {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/vote-mystery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mysteryId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to vote');
      }

      setSelectedMystery(mysteryId);
      setHasVoted(true);

      // Check if all players have voted
      checkIfAllVotedAndStartNextRound();
    } catch (err: any) {
      console.error('Error voting:', err);
      setErrorSnackbar({ open: true, message: err.message || 'Erreur lors du vote' });
    }
  }

  async function checkIfAllVotedAndStartNextRound() {
    try {
      // Get all active players
      const { data: activePlayers, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'active');

      if (playersError) {
        console.error('Error fetching active players:', playersError);
        return;
      }

      // Get current vote count
      const tallyResponse = await fetch(`/api/sessions/${sessionId}/tally-votes`);
      if (!tallyResponse.ok) return;

      const { totalVotes } = await tallyResponse.json();

      // If all active players have voted, start next round
      if (totalVotes === activePlayers?.length) {
        setStartingNextRound(true);
        
        const nextRoundResponse = await fetch(`/api/sessions/${sessionId}/next-round`, {
          method: 'POST',
        });

        if (nextRoundResponse.ok) {
          // Reload the page to show new character sheet
          window.location.reload();
        } else {
          setStartingNextRound(false);
          const errorData = await nextRoundResponse.json();
          setErrorSnackbar({ open: true, message: errorData.error || 'Erreur lors du démarrage du prochain tour' });
        }
      }
    } catch (err) {
      console.error('Error checking votes:', err);
      setStartingNextRound(false);
    }
  }

  function setupVoteSubscription() {
    const channel = supabase
      .channel(`session-${sessionId}-votes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mystery_votes',
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // Recalculate vote counts
          const tallyResponse = await fetch(`/api/sessions/${sessionId}/tally-votes`);
          if (tallyResponse.ok) {
            const { voteCounts } = await tallyResponse.json();
            setVoteCounts(voteCounts);
            
            // Check if all voted
            checkIfAllVotedAndStartNextRound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
  function setupRealtimeSubscription() {
    console.log('Setting up realtime subscription for session:', sessionId);
    
    // Subscribe to player status changes
    const channel = supabase
      .channel(`session-${sessionId}-players`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('Player updated in play page:', payload.new);
          const updatedPlayer = payload.new as Player;
          if (updatedPlayer.id === currentPlayer?.id && updatedPlayer.status === 'accused') {
            setIsAccused(true);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Play page channel status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to players channel in play page');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Play page channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Play page channel timed out');
        }
      });

    return () => {
      console.log('Cleaning up play page realtime subscription');
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
      <Container maxWidth="md">
        <Box sx={{ py: 8 }}>
          <Alert severity="info">Loading character sheet...</Alert>
        </Box>
      </Container>
    );
  }

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

      // Determine the message based on the player's role
      let message = '';
      if (characterSheet.role === 'investigator') {
        message = data.messages.investigator;
      } else if (characterSheet.role === 'guilty') {
        message = data.messages.guilty;
      } else {
        message = data.messages.innocent;
      }

      setAccusationResult({
        wasCorrect: data.wasCorrect,
        role: data.accusedRole,
        gameComplete: data.gameComplete,
        message,
      });

      setAccuseDialogOpen(false);
    } catch (err: any) {
      console.error('Error submitting accusation:', err);
      setErrorSnackbar({ open: true, message: err.message || 'Erreur lors de l\'accusation' });
    } finally {
      setSubmittingAccusation(false);
    }
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
                ACCUSÉ !
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Mystery Title */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" color="primary" gutterBottom>
              {characterSheet.mystery.title}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Votre fiche de personnage
            </Typography>
            
            {/* Always show Investigator or Suspect */}
            <Chip
              label={characterSheet.role === 'investigator' ? 'ENQUÊTEUR' : 'SUSPECT'}
              color={characterSheet.role === 'investigator' ? 'info' : 'default'}
              sx={{ fontSize: '1rem', px: 2, py: 1.5, mb: 2 }}
            />
            
            {/* For suspects only: show guilty/innocent reveal */}
            {characterSheet.role !== 'investigator' && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
                  {roleRevealed && (
                    <Chip
                      label={characterSheet.role.toUpperCase()}
                      color={getRoleColor(characterSheet.role) as any}
                      sx={{ fontSize: '1rem', px: 2, py: 3 }}
                    />
                  )}
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
                      {characterSheet.role === 'guilty' ? 'Vous êtes COUPABLE' : 'Vous êtes INNOCENT'}
                    </Typography>
                  </motion.div>
                )}
              </Box>
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

          {/* Investigator sees Mystery Description */}
          {characterSheet.role === 'investigator' && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>📖 Description du mystère</Typography>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {characterSheet.mystery.description}
                </ReactMarkdown>
              </Paper>
            </Box>
          )}

          {/* Dark Secret - Only for guilty/innocent */}
          {characterSheet.role !== 'investigator' && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">🤫 Sombre Secret </Typography>
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
          )}

          {/* Words to Place - Only for guilty/innocent */}
          {characterSheet.role !== 'investigator' && characterSheet.wordsToPlace.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                💬 Trois mots à placer dans la conversation
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          )}

          {/* Alibi - Only for guilty/innocent */}
          {characterSheet.role !== 'investigator' && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">🕵️ Votre alibi</Typography>
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
          )}

          {characterSheet.role === 'investigator' && !accusationResult && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                color="error"
                onClick={() => setAccuseDialogOpen(true)}
                sx={{ 
                  fontSize: '1.2rem', 
                  px: 4, 
                  py: 2,
                  fontWeight: 'bold',
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 6,
                  }
                }}
              >
                🔍 J&apos;Accuse!
              </Button>
            </Box>
          )}

          {accusationResult && (
            <Alert
              severity={accusationResult.wasCorrect ? 'success' : 'error'}
              sx={{ mt: 4 }}
            >
              {accusationResult.message}
            </Alert>
          )}

          {/* Scoreboard and Mystery Voting - shown after accusation unless game is complete */}
          {accusationResult && !accusationResult.gameComplete && (
            <>
              {/* Scoreboard */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom align="center">
                  🏆 Scores
                </Typography>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <List>
                    {playerScores.map((player, index) => (
                      <ListItem
                        key={player.id}
                        sx={{
                          borderBottom: index < playerScores.length - 1 ? '1px solid #eee' : 'none',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="h6" sx={{ minWidth: '30px' }}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                              </Typography>
                              <Typography variant="body1" sx={{ flex: 1 }}>
                                {player.name} {player.id === currentPlayer?.id ? '(Vous)' : ''}
                              </Typography>
                              <Chip label={`${player.score} pts`} color="primary" />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>

              {/* Mystery Voting */}
              {availableMysteries.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h5" gutterBottom align="center">
                    🎭 Votez pour le prochain mystère
                  </Typography>
                  <Paper elevation={2} sx={{ p: 3 }}>
                    {!hasVoted ? (
                      <List>
                        {availableMysteries.map((mystery) => (
                          <ListItem key={mystery.id} disablePadding>
                            <ListItemButton
                              selected={selectedMystery === mystery.id}
                              onClick={() => handleVoteForMystery(mystery.id)}
                            >
                              <Radio checked={selectedMystery === mystery.id} />
                              <ListItemText
                                primary={mystery.title}
                                secondary={
                                  voteCounts[mystery.id]
                                    ? `${voteCounts[mystery.id]} vote(s)`
                                    : '0 vote'
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body1" gutterBottom>
                          ✅ Vote enregistré !
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          En attente des autres joueurs...
                        </Typography>
                        {startingNextRound && (
                          <Box sx={{ mt: 3 }}>
                            <CircularProgress />
                            <Typography variant="body2" sx={{ mt: 2 }}>
                              Démarrage du prochain tour...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {availableMysteries.length === 0 && (
                <Alert severity="info" sx={{ mt: 4 }}>
                  Aucun mystère disponible pour continuer. La partie est terminée !
                </Alert>
              )}
            </>
          )}

          {/* Game Complete */}
          {accusationResult && accusationResult.gameComplete && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom>
                🎉 Partie terminée !
              </Typography>
              <Typography variant="h6" gutterBottom>
                Scores finaux :
              </Typography>
              <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
                <List>
                  {playerScores.map((player, index) => (
                    <ListItem
                      key={player.id}
                      sx={{
                        borderBottom: index < playerScores.length - 1 ? '1px solid #eee' : 'none',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ minWidth: '30px' }}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                            </Typography>
                            <Typography variant="body1" sx={{ flex: 1 }}>
                              {player.name} {player.id === currentPlayer?.id ? '(Vous)' : ''}
                            </Typography>
                            <Chip label={`${player.score} pts`} color="primary" />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 4 }}>
            ⚠️ Gardez votre fiche de personnage secrète des autres joueurs !
          </Alert>
        </Paper>

        {/* Accusation Dialog */}
        <Dialog
          open={accuseDialogOpen}
          onClose={() => !submittingAccusation && setAccuseDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Sélectionnez le coupable</DialogTitle>
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
              Annuler
            </Button>
            <Button
              onClick={handleAccuse}
              variant="contained"
              color="error"
              disabled={!selectedPlayer || submittingAccusation}
            >
              {submittingAccusation ? 'Accusation en cours...' : 'Accuser'}
            </Button>
          </DialogActions>
        </Dialog>
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

      {/* Error Snackbar */}
      <Snackbar
        open={errorSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setErrorSnackbar({ open: false, message: '' })}
        message={errorSnackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
