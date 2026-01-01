'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { usePlayerPresence } from '@/hooks/usePlayerPresence';
import LoadingScreen from '@/components/LoadingScreen';
import TransitionScreen from '@/components/TransitionScreen';
import { RoleHelpDialog } from '@/components/play';
import {
  JoinCodeDisplay,
  PlayerList,
  LanguageSelector,
  MysteryVotingList,
  ReadyStatusBar,
  RemovePlayerDialog,
} from '@/components/lobby';
import type { Database } from '@/types/database';
import { MIN_PLAYERS } from '@/lib/constants';
import { HELP_CONTENT } from '@/app/play/[sessionId]/constants';

type Player = Database['public']['Tables']['players']['Row'];
type GameSession = Database['public']['Tables']['game_sessions']['Row'];

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [mysteries, setMysteries] = useState<any[]>([]);
  const [votes, setVotes] = useState<Map<string, string>>(new Map());
  const [myVote, setMyVote] = useState<string | null>(null);
  const [mysteryCount, setMysteryCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [sessionNotFound, setSessionNotFound] = useState(false);

  const supabase = createClient();

  // Get current player name for presence
  const currentPlayerName = players.find(p => p.id === currentPlayerId)?.name || null;

  // Track player presence using Supabase Presence (no database updates)
  usePlayerPresence(sessionId, currentPlayerId, currentPlayerName, true);

  useEffect(() => {
    loadSessionData();
    const cleanup = setupRealtimeSubscriptions();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [sessionId]);

  // Load vote when currentPlayerId is available
  useEffect(() => {
    if (currentPlayerId) {
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
  
  // Derive ready state from votes - a player is "ready" if they've voted
  const voteCount = votes.size;
  const readyStates = new Map<string, boolean>();
  activePlayers.forEach(p => readyStates.set(p.id, votes.has(p.id)));
  const isReady = currentPlayerId ? votes.has(currentPlayerId) : false;
  
  const canStart = activePlayers.length >= MIN_PLAYERS && voteCount === activePlayers.length && availableMysteries.length > 0;

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

      // Load players directly (not via loadPlayers) so we can check membership
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (playersError) {
        console.error('Error loading players:', playersError);
      }
      const loadedPlayers = playersData || [];
      setPlayers(loadedPlayers);

      // Get current player ID from session cookie by checking the response
      const response = await fetch('/api/session/me');
      if (response.ok) {
        const data = await response.json();
        const playerId = data.playerId;
        
        // Check if this player belongs to this session
        const playerInSession = loadedPlayers.find(p => p.id === playerId);
        if (!playerInSession) {
          // Player is authenticated but not for this session, redirect to join
          router.push(`/join?code=${sessionData.join_code}`);
          return;
        }
        
        setCurrentPlayerId(playerId);
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
      // Check if session not found (PGRST116 = single() returned 0 rows)
      // or invalid UUID (22P02 = invalid syntax)
      if (err.code === 'PGRST116' || err.code === '22P02' || err.message?.includes('0 rows')) {
        setSessionNotFound(true);
        setLoading(false);
        // Auto-redirect after 5 seconds
        setTimeout(() => router.push('/'), 5000);
        return;
      }
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
          const updatedPlayer = payload.new as Player;
          
          // Check if current player was kicked or quit
          if (updatedPlayer.id === currentPlayerId && updatedPlayer.status === 'quit') {
            console.log('Current player quit/was removed, redirecting...');
            router.push('/join?kicked=true');
            return;
          }
          
          // Update the player in the list
          setPlayers((prev) =>
            prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
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

  async function handleVote(mysteryId: string | null) {
    if (!currentPlayerId) return;

    try {
      // Optimistic update
      setMyVote(mysteryId);
      const newVotes = new Map(votes);
      if (mysteryId) {
        newVotes.set(currentPlayerId, mysteryId);
      } else {
        newVotes.delete(currentPlayerId);
      }
      setVotes(newVotes);

      // Use vote-mystery endpoint which handles both voting AND triggers 
      // next-round when all players have voted (unified flow for lobby & play)
      const response = await fetch(`/api/sessions/${sessionId}/vote-mystery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mysteryId }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      // Ready state is now derived from votes - no need to call mark-ready
      // The vote-mystery endpoint handles triggering next-round when all voted
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to submit vote');
      refreshVotes();
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

  function openRemoveDialog(playerId: string, playerName: string) {
    setPlayerToRemove({ id: playerId, name: playerName });
    setRemoveDialogOpen(true);
  }

  function closeRemoveDialog() {
    setRemoveDialogOpen(false);
    setPlayerToRemove(null);
  }

  async function handleRemovePlayer() {
    if (!playerToRemove) return;

    setRemoveLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/players/${playerToRemove.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to remove player');
        setTimeout(() => setError(''), 3000);
      }
      
      closeRemoveDialog();
    } catch (err) {
      console.error('Error removing player:', err);
      setError('Failed to remove player');
      setTimeout(() => setError(''), 3000);
    } finally {
      setRemoveLoading(false);
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

  if (sessionNotFound) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
              🔍 Partie introuvable
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Cette partie n'existe pas ou a été supprimée.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Redirection automatique dans quelques secondes...
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/')}
            >
              Retour à l'accueil
            </Button>
          </Paper>
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

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4, minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 0 }}>
              Salle d'attente
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<HelpIcon />}
              onClick={() => setHelpDialogOpen(true)}
            >
              Déroulement du jeu
            </Button>
          </Box>

          {session && <JoinCodeDisplay code={session.join_code} />}

          {/* QR Code */}
          {session && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 2,
                    display: 'inline-block',
                    mb: 1,
                  }}
                >
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${session.join_code}`}
                    size={200}
                    level="H"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Scannez pour rejoindre
                </Typography>
              </Box>
            </Box>
          )}

          <PlayerList
            players={activePlayers}
            currentPlayerId={currentPlayerId}
            readyStates={readyStates}
            minPlayers={MIN_PLAYERS}
            onRemovePlayer={openRemoveDialog}
          />

          <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5">
              Votez pour le mystère
            </Typography>
            
            <LanguageSelector
              value={session?.language || 'fr'}
              onChange={handleLanguageChange}
            />
          </Box>

          <MysteryVotingList
            mysteries={mysteries}
            availableMysteries={availableMysteries}
            votes={votes}
            myVote={myVote}
            onVote={handleVote}
            hasLanguage={!!session?.language}
          />

          <ReadyStatusBar
            readyCount={voteCount}
            totalPlayers={activePlayers.length}
            canStart={canStart}
            minPlayers={MIN_PLAYERS}
            availableMysteriesCount={availableMysteries.length}
            onRefresh={() => window.location.reload()}
            onQuit={handleQuit}
          />
        </Paper>
      </Box>

      {/* Game Start Transition */}
      <TransitionScreen
        isVisible={showTransition}
        title="La partie commence"
        subtitle="Préparez-vous à résoudre le mystère"
        imageUrl={session?.current_mystery_id ? mysteries.find(m => m.id === session.current_mystery_id)?.image_path : undefined}
        duration={2500}
      />

      {/* Remove Player Dialog */}
      <RemovePlayerDialog
        open={removeDialogOpen}
        playerName={playerToRemove?.name || ''}
        onConfirm={handleRemovePlayer}
        onCancel={closeRemoveDialog}
        loading={removeLoading}
      />

      {/* Help Dialog */}
      <RoleHelpDialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        helpContent={HELP_CONTENT.rules}
      />
    </Container>
  );
}
