'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { MIN_PLAYERS } from '@/lib/constants';

type Mystery = Database['public']['Tables']['mysteries']['Row'];
type GameSession = Database['public']['Tables']['game_sessions']['Row'];
type Player = Database['public']['Tables']['players']['Row'];

export default function AdminSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<GameSession | null>(null);
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMystery, setSelectedMystery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, [sessionId]);

  async function loadData() {
    try {
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Load mysteries
      const { data: mysteriesData, error: mysteriesError } = await supabase
        .from('mysteries')
        .select('*')
        .order('created_at', { ascending: false });

      if (mysteriesError) throw mysteriesError;
      setMysteries(mysteriesData || []);

      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
      setLoading(false);
    }
  }

  function setupRealtimeSubscriptions() {
    const playersChannel = supabase
      .channel(`admin-session-${sessionId}-players`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
    };
  }

  async function handleStartGame() {
    if (!selectedMystery) return;

    setStarting(true);
    setError('');

    try {
      const response = await fetch(`/api/sessions/${sessionId}/distribute-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mysteryId: selectedMystery }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start game');
      }

      alert('Game started! Players are receiving their character sheets.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    } finally {
      setStarting(false);
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

  const activePlayers = players.filter((p) => p.status === 'active');

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Tableau de bord administrateur
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {session && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Code d'accès
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: 'monospace',
                  letterSpacing: 4,
                  color: 'primary.main',
                  mb: 2,
                }}
              >
                {session.join_code}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Statut : {session.status}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom>
            Joueurs ({activePlayers.length})
          </Typography>
          <List sx={{ mb: 3 }}>
            {activePlayers.map((player) => (
              <ListItem key={player.id}>
                <ListItemText primary={player.name} secondary={`Statut : ${player.status}`} />
              </ListItem>
            ))}
          </List>

          {activePlayers.length < MIN_PLAYERS && (
            <Alert severity="info" sx={{ mb: 3 }}>
              En attente d'au moins {MIN_PLAYERS} joueurs...
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          {session?.status === 'lobby' && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Démarrer la partie
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Sélectionner un mystère</InputLabel>
                <Select
                  value={selectedMystery}
                  onChange={(e) => setSelectedMystery(e.target.value)}
                  label="Sélectionner un mystère"
                >
                  {mysteries.map((mystery) => (
                    <MenuItem key={mystery.id} value={mystery.id}>
                      {mystery.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                size="large"
                onClick={handleStartGame}
                disabled={!selectedMystery || activePlayers.length < MIN_PLAYERS || starting}
                fullWidth
              >
                {starting ? <CircularProgress size={24} /> : 'Démarrer la partie'}
              </Button>

              {mysteries.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Aucun mystère disponible. Veuillez d'abord télécharger des mystères.
                </Alert>
              )}
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => router.push('/admin/mysteries/upload')}
            >
              Télécharger des mystères
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
