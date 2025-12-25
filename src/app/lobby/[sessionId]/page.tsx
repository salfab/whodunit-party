'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { usePlayerHeartbeat } from '@/hooks/usePlayerHeartbeat';
import LoadingScreen from '@/components/LoadingScreen';
import TransitionScreen from '@/components/TransitionScreen';
import MysteryCard from '@/components/shared/MysteryCard';
import type { Database } from '@/types/database';
import { MIN_PLAYERS } from '@/lib/constants';

type Player = Database['public']['Tables']['players']['Row'];
type GameSession = Database['public']['Tables']['game_sessions']['Row'];

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const [readyStates, setReadyStates] = useState<Map<string, boolean>>(new Map());
  const [mysteries, setMysteries] = useState<any[]>([]);
  const [votes, setVotes] = useState<Map<string, string>>(new Map());
  const [myVote, setMyVote] = useState<string | null>(null);
  const [mysteryCount, setMysteryCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTransition, setShowTransition] = useState(false);

  const supabase = createClient();

  // Send heartbeats to keep player active
  usePlayerHeartbeat(currentPlayerId, true);

  useEffect(() => {
    loadSessionData();
    const cleanup = setupRealtimeSubscriptions();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [sessionId]);

  // Load ready state and vote when currentPlayerId is available
  useEffect(() => {
    if (currentPlayerId) {
      checkReadyStates();
      if (votes.has(currentPlayerId)) {
        setMyVote(votes.get(currentPlayerId) || null);
      }
    }
  }, [currentPlayerId, votes]);

  // Reload mysteries when session language changes
  useEffect(() => {
    if (session?.language) {
      loadMysteriesByLanguage(session.language);
    }
  }, [session?.language]);

  async function loadMysteriesByLanguage(language: string) {
    try {
      const mysteriesResponse = await fetch(`/api/mysteries?language=${language}&includeCharacterCount=true`);
      if (mysteriesResponse.ok) {
        const data = await mysteriesResponse.json();
        const loadedMysteries = data.mysteries || [];
        setMysteries(loadedMysteries);
        setMysteryCount(loadedMysteries.length);
      }
    } catch (err) {
      console.error('Error loading mysteries:', err);
    }
  }

  // Calculate if game can start
  const activePlayers = players.filter((p) => p.status === 'active');
  
  // Filter mysteries that can accommodate the current player count
  const availableMysteries = mysteries.filter(
    (mystery) => mystery.character_count >= activePlayers.length
  );
  
  const canStart = activePlayers.length >= MIN_PLAYERS && readyCount === activePlayers.length && availableMysteries.length > 0;

  // Auto-redirect when game status changes to 'playing'
  useEffect(() => {
    if (session?.status === 'playing' && !showTransition) {
      console.log('Session status changed to playing, showing transition...');
      setShowTransition(true);
      // Redirect after transition completes
      setTimeout(() => {
        router.push(`/play/${sessionId}`);
      }, 2500);
    }
  }, [session?.status, sessionId, router, showTransition]);

  async function loadSessionData() {
    try {
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Load players
      await loadPlayers();

      // Get current player ID from session cookie by checking the response
      const response = await fetch('/api/session/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlayerId(data.playerId);
      } else {
        // User is not authenticated, redirect to join page
        router.push(`/join?code=${sessionData.join_code}`);
        return;
      }

      // Fetch mysteries filtered by session language
      const mysteriesResponse = await fetch(`/api/mysteries?language=${sessionData.language || 'fr'}&includeCharacterCount=true`);
      if (mysteriesResponse.ok) {
        const data = await mysteriesResponse.json();
        const loadedMysteries = data.mysteries || [];
        setMysteries(loadedMysteries);
        setMysteryCount(loadedMysteries.length);
      }

      // Get next round number
      const { data: rounds } = await (supabase
        .from('rounds') as any)
        .select('round_number')
        .eq('session_id', sessionId)
        .order('round_number', { ascending: false })
        .limit(1);
      
      const nextRoundNumber = (rounds && rounds.length > 0) ? rounds[0].round_number + 1 : 1;

      // Fetch votes for next round only
      const { data: votesData } = await (supabase
        .from('mystery_votes') as any)
        .select('*')
        .eq('session_id', sessionId)
        .eq('round_number', nextRoundNumber);
      
      if (votesData) {
        const newVotes = new Map<string, string>();
        votesData.forEach((v: any) => newVotes.set(v.player_id, v.mystery_id));
        setVotes(newVotes);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading session data:', err);
      setError(err.message || 'Failed to load session');
      setLoading(false);
    }
  }

  async function loadPlayers() {
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (playersError) {
      console.error('Error loading players:', playersError);
      return;
    }
    
    setPlayers(playersData || []);
  }

  function setupRealtimeSubscriptions() {
    console.log('Setting up realtime subscriptions for session:', sessionId);
    
    // Subscribe to players changes - realtime updates when players join/leave
    const playersChannel = supabase
      .channel(`session-${sessionId}-players`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('New player joined:', payload.new);
          // Add the new player to the list
          setPlayers((prev) => {
            const exists = prev.some(p => p.id === (payload.new as Player).id);
            if (exists) return prev;
            return [...prev, payload.new as Player];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Player updated:', payload.new);
          // Update the player in the list
          setPlayers((prev) =>
            prev.map((p) => (p.id === (payload.new as Player).id ? (payload.new as Player) : p))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Player deleted:', payload.old);
          // Remove the player from the list
          setPlayers((prev) => prev.filter((p) => p.id !== (payload.old as Player).id));
        }
      )
      .subscribe((status, err) => {
        console.log('Players channel status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to players channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Players channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Players channel timed out');
        }
      });

    // Subscribe to ready states
    const readyChannel = supabase
      .channel(`session-${sessionId}-ready`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_ready_states',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Ready state changed:', payload);
          // Immediately update ready count when any player's state changes
          checkReadyStates();
        }
      )
      .subscribe((status, err) => {
        console.log('Ready channel status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to ready states channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Ready states channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Ready states channel timed out');
        }
      });

    // Subscribe to game_sessions status changes
    const sessionChannel = supabase
      .channel(`session-${sessionId}-status`, {
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
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Game session updated:', payload.new);
          setSession(payload.new as GameSession);
        }
      )
      .subscribe((status, err) => {
        console.log('Session channel status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to session status channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Session channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Session channel timed out');
        }
      });

    // Subscribe to mystery_votes
    const votesChannel = supabase
      .channel(`session-${sessionId}-votes`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mystery_votes',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Vote changed:', payload);
          refreshVotes();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(readyChannel);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(votesChannel);
    };
  }

  async function refreshVotes() {
    // Get next round number
    const { data: rounds } = await (supabase
      .from('rounds') as any)
      .select('round_number')
      .eq('session_id', sessionId)
      .order('round_number', { ascending: false })
      .limit(1);
    
    const nextRoundNumber = (rounds && rounds.length > 0) ? rounds[0].round_number + 1 : 1;

    const { data: votesData } = await (supabase
      .from('mystery_votes') as any)
      .select('*')
      .eq('session_id', sessionId)
      .eq('round_number', nextRoundNumber);
    
    if (votesData) {
      const newVotes = new Map<string, string>();
      votesData.forEach((v: any) => newVotes.set(v.player_id, v.mystery_id));
      setVotes(newVotes);
    }
  }

  async function checkReadyStates() {
    const { data: readyStatesData } = await supabase
      .from('player_ready_states')
      .select('*')
      .eq('session_id', sessionId);

    const readyPlayers = readyStatesData?.filter((s) => s.is_ready) || [];
    setReadyCount(readyPlayers.length);

    // Build ready states map for display
    const statesMap = new Map<string, boolean>();
    readyStatesData?.forEach((state) => {
      statesMap.set(state.player_id, state.is_ready);
    });
    setReadyStates(statesMap);

    // Check if current player is ready
    if (currentPlayerId) {
      const myReadyState = readyStatesData?.find((s) => s.player_id === currentPlayerId);
      setIsReady(myReadyState?.is_ready || false);
    }
  }

  async function handleVote(mysteryId: string) {
    if (!currentPlayerId) return;

    try {
      // Optimistic update
      setMyVote(mysteryId);
      const newVotes = new Map(votes);
      newVotes.set(currentPlayerId, mysteryId);
      setVotes(newVotes);

      const response = await fetch(`/api/sessions/${sessionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mysteryId }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      // Automatically mark player as ready after voting
      if (!isReady) {
        const readyResponse = await fetch(`/api/sessions/${sessionId}/mark-ready`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isReady: true }),
        });

        if (readyResponse.ok) {
          setIsReady(true);
        }
      }
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to submit vote');
      refreshVotes();
    }
  }

  async function handleReadyToggle() {
    if (!currentPlayerId) {
      console.error('No current player ID');
      return;
    }

    const newReadyState = !isReady;
    console.log('Toggling ready state to:', newReadyState);

    try {
      // Optimistically update UI
      setIsReady(newReadyState);
      
      const response = await fetch(`/api/sessions/${sessionId}/mark-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isReady: newReadyState }),
      });

      if (!response.ok) {
        console.error('Error updating ready state');
        // Revert optimistic update on error
        setIsReady(!newReadyState);
        setError('Failed to update ready state. Please try again.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const data = await response.json();
      console.log('Ready state updated successfully', data);

      // If game started, redirect to play page
      if (data.gameStarted) {
        console.log('Game started! Redirecting to play page...');
        router.push(`/play/${sessionId}`);
      }
    } catch (err) {
      console.error('Error updating ready state:', err);
      // Revert optimistic update
      setIsReady(!newReadyState);
      setError('Failed to update ready state. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  }

  async function handleQuit() {
    if (!currentPlayerId) return;

    try {
      await supabase
        .from('players')
        .update({ status: 'quit' })
        .eq('id', currentPlayerId);

      router.push('/');
    } catch (err) {
      console.error('Error quitting game:', err);
    }
  }

  async function handleLanguageChange(newLanguage: string) {
    if (!session) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/update-language`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLanguage }),
      });

      if (!response.ok) {
        console.error('Error updating language');
        setError('Failed to update language. Please try again.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Language will be updated via Realtime subscription
      console.log('Language updated successfully');
    } catch (err) {
      console.error('Error updating language:', err);
      setError('Failed to update language. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  }

  if (loading) {
    return <LoadingScreen message="Chargement de la salle d'attente" />;
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

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4, minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom textAlign="center">
            Salle d'attente
          </Typography>

          {session && (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Code d'accès
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: 'monospace',
                  letterSpacing: 4,
                  color: 'primary.main',
                }}
              >
                {session.join_code}
              </Typography>
            </Box>
          )}

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Joueurs ({activePlayers.length}/{MIN_PLAYERS} minimum)
          </Typography>

          <List sx={{ mb: 3 }}>
            <AnimatePresence>
              {activePlayers.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <ListItem
                    secondaryAction={
                      readyStates.get(player.id) ? (
                        <CheckCircle color="success" />
                      ) : null
                    }
                  >
                    <ListItemText primary={player.name} />
                    {player.id === currentPlayerId && (
                      <Chip label="Vous" color="primary" size="small" sx={{ mr: 1 }} />
                    )}
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>

          <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5">
              Votez pour le mystère
            </Typography>
            
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="language-select-label">Langue</InputLabel>
              <Select
                labelId="language-select-label"
                value={session?.language || 'fr'}
                label="Langue"
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
                <MenuItem value="it">Italiano</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {availableMysteries.length > 0 && (
              <List sx={{ mb: 3 }}>
                {availableMysteries.map((mystery) => {
                  const voteCount = Array.from(votes.values()).filter(v => v === mystery.id).length;
                  const isSelected = myVote === mystery.id;
                  
                  return (
                    <MysteryCard
                      key={mystery.id}
                      mystery={mystery}
                      selected={isSelected}
                      voteCount={voteCount}
                      onClick={() => handleVote(mystery.id)}
                    />
                  );
                })}
              </List>
          )}

          {mysteries.length === 0 && session?.language && (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6, 
                px: 3, 
                mb: 3,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun mystère disponible
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aucun mystère n'a été trouvé pour la langue sélectionnée.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Essayez de changer la langue.
              </Typography>
            </Box>
          )}

          {activePlayers.length < MIN_PLAYERS && (
            <Alert severity="info" sx={{ mb: 3 }}>
              En attente d'au moins {MIN_PLAYERS} joueurs...
            </Alert>
          )}

          {availableMysteries.length > 0 && availableMysteries.length < activePlayers.length && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              ⚠️ Attention : Seulement {availableMysteries.length} mystère{availableMysteries.length > 1 ? 's' : ''} disponible{availableMysteries.length > 1 ? 's' : ''} pour {activePlayers.length} joueurs. La partie se terminera après {availableMysteries.length} manche{availableMysteries.length > 1 ? 's' : ''}.
            </Alert>
          )}

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" color={canStart ? 'success.main' : 'text.secondary'}>
              Prêts : {readyCount} / {activePlayers.length}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant={isReady ? 'outlined' : 'contained'}
              size="large"
              onClick={handleReadyToggle}
              disabled={activePlayers.length < MIN_PLAYERS || availableMysteries.length === 0}
            >
              {isReady ? 'Pas prêt' : 'Prêt'}
            </Button>

            <Button variant="outlined" size="large" color="error" onClick={handleQuit}>
              Quitter
            </Button>
          </Box>

          {canStart && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert severity="success" sx={{ mt: 3 }}>
                Tous les joueurs sont prêts ! Démarrage automatique...
              </Alert>
            </motion.div>
          )}
        </Paper>
      </Box>

      {/* Game Start Transition */}
      <TransitionScreen
        isVisible={showTransition}
        title="La partie commence"
        subtitle="Préparez-vous à résoudre le mystère"
        duration={2500}
      />
    </Container>
  );
}
