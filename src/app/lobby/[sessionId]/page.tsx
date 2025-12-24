'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { usePlayerHeartbeat } from '@/hooks/usePlayerHeartbeat';
import type { Database } from '@/types/database';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Load ready state when currentPlayerId is available
  useEffect(() => {
    if (currentPlayerId) {
      checkReadyStates();
    }
  }, [currentPlayerId]);

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
      .channel(`session-${sessionId}-players`)
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
      .subscribe((status) => {
        console.log('Players channel status:', status);
      });

    // Subscribe to ready states
    const readyChannel = supabase
      .channel(`session-${sessionId}-ready`)
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
      .subscribe((status) => {
        console.log('Ready channel status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(readyChannel);
    };
  }

  async function checkReadyStates() {
    const { data: readyStates } = await supabase
      .from('player_ready_states')
      .select('*')
      .eq('session_id', sessionId);

    const readyPlayers = readyStates?.filter((s) => s.is_ready) || [];
    setReadyCount(readyPlayers.length);

    // Check if current player is ready
    if (currentPlayerId) {
      const myReadyState = readyStates?.find((s) => s.player_id === currentPlayerId);
      setIsReady(myReadyState?.is_ready || false);
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
      
      const { error } = await supabase
        .from('player_ready_states')
        .upsert(
          {
            session_id: sessionId,
            player_id: currentPlayerId,
            is_ready: newReadyState,
          },
          {
            onConflict: 'session_id,player_id',
          }
        );

      if (error) {
        console.error('Error updating ready state:', error);
        // Revert optimistic update on error
        setIsReady(!newReadyState);
        setError('Failed to update ready state. Please try again.');
        setTimeout(() => setError(''), 3000);
      } else {
        console.log('Ready state updated successfully');
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

  const activePlayers = players.filter((p) => p.status === 'active');
  const minPlayers = 5;
  const canStart = activePlayers.length >= minPlayers && readyCount === activePlayers.length;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4, minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom textAlign="center">
            Game Lobby
          </Typography>

          {session && (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Join Code
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
            Players ({activePlayers.length}/{minPlayers} minimum)
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
                  <ListItem>
                    <ListItemText primary={player.name} />
                    {player.id === currentPlayerId && (
                      <Chip label="You" color="primary" size="small" />
                    )}
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>

          {activePlayers.length < minPlayers && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Waiting for at least {minPlayers} players to join...
            </Alert>
          )}

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" color={canStart ? 'success.main' : 'text.secondary'}>
              Ready: {readyCount} / {activePlayers.length}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant={isReady ? 'outlined' : 'contained'}
              size="large"
              onClick={handleReadyToggle}
              disabled={activePlayers.length < minPlayers}
            >
              {isReady ? 'Not Ready' : 'Ready to Start'}
            </Button>

            <Button variant="outlined" size="large" color="error" onClick={handleQuit}>
              Quit Game
            </Button>
          </Box>

          {canStart && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert severity="success" sx={{ mt: 3 }}>
                All players are ready! Starting game...
              </Alert>
            </motion.div>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
