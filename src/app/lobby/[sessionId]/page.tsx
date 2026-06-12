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
  IconButton,
  Tooltip,
} from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
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
  LobbyWordmark,
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
              Partie introuvable
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
    <Container maxWidth="sm" disableGutters>
      <Box sx={{ minHeight: '100svh', px: { xs: 1.25, sm: 2 }, py: { xs: 1, sm: 3 } }}>
        <Box
          component="section"
          sx={{
            minHeight: { xs: 'calc(100svh - 16px)', sm: 'auto' },
            p: { xs: 1.45, sm: 2.4 },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 0.9, sm: 1.65 },
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 1,
            border: '1px solid rgba(184, 150, 95, 0.34)',
            bgcolor: 'rgba(7, 8, 10, 0.58)',
            backgroundImage:
              'linear-gradient(180deg, rgba(184, 150, 95, 0.11) 0%, transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.04), transparent 36%)',
            boxShadow: '0 26px 86px rgba(0, 0, 0, 0.56), inset 0 0 70px rgba(0, 0, 0, 0.36)',
            backdropFilter: 'blur(8px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 9,
              border: '1px solid rgba(184, 150, 95, 0.13)',
              borderRadius: 1,
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'radial-gradient(circle at 0% 34%, rgba(120, 147, 154, 0.13), transparent 16rem), radial-gradient(circle at 100% 74%, rgba(184, 150, 95, 0.13), transparent 15rem)',
            },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'start',
              gap: 1,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <LobbyWordmark />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <LanguageSelector
                value={session?.language || 'fr'}
                onChange={handleLanguageChange}
                compact
              />
              <Tooltip title="Aide">
                <IconButton
                  onClick={() => setHelpDialogOpen(true)}
                  aria-label="Aide"
                  sx={{
                    width: 38,
                    height: 38,
                    color: 'text.primary',
                    border: '1px solid rgba(184, 150, 95, 0.58)',
                    bgcolor: 'rgba(7, 8, 10, 0.28)',
                  }}
                >
                  <HelpIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: { xs: 0.65, sm: 1.1 },
                mt: { xs: -0.05, sm: 0.3 },
                mb: { xs: 0.15, sm: 0.4 },
              }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  position: 'relative',
                  height: 16,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    height: '1px',
                    bgcolor: 'rgba(184, 150, 95, 0.48)',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    width: 7,
                    height: 7,
                    border: '1px solid rgba(184, 150, 95, 0.86)',
                    transform: 'translateY(-50%) rotate(45deg)',
                    bgcolor: 'rgba(7, 8, 10, 0.8)',
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    right: 13,
                    top: 2,
                    width: { xs: 34, sm: 58 },
                    height: '1px',
                    bgcolor: 'rgba(184, 150, 95, 0.72)',
                  }}
                />
              </Box>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  display: 'inline-block',
                  fontSize: { xs: '1.38rem', sm: '2.22rem' },
                  fontFamily: '"Lobby Deco Display", "Bodoni MT Poster Compressed", "Bodoni MT Condensed", "Bodoni MT", "Didot", serif',
                  fontWeight: 700,
                  fontVariantCaps: 'small-caps',
                  letterSpacing: { xs: '0.052em', sm: '0.064em' },
                  lineHeight: 0.86,
                  position: 'relative',
                  zIndex: 1,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  color: '#efe5cf',
                  backgroundImage:
                    'linear-gradient(180deg, #f7efdc 0%, #e2d3b6 100%), radial-gradient(circle, rgba(7, 8, 10, 0.22) 0 0.48px, transparent 0.72px)',
                  backgroundSize: '100% 100%, 6px 6px',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 3px 14px rgba(0, 0, 0, 0.72)',
                  transform: 'scaleX(0.82) scaleY(1.2)',
                  transformOrigin: 'center',
                }}
              >
                Salle d’attente
              </Typography>
              <Box
                aria-hidden="true"
                sx={{
                  position: 'relative',
                  height: 16,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    height: '1px',
                    bgcolor: 'rgba(184, 150, 95, 0.48)',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: 7,
                    height: 7,
                    border: '1px solid rgba(184, 150, 95, 0.86)',
                    transform: 'translateY(-50%) rotate(45deg)',
                    bgcolor: 'rgba(7, 8, 10, 0.8)',
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 13,
                    top: 2,
                    width: { xs: 34, sm: 58 },
                    height: '1px',
                    bgcolor: 'rgba(184, 150, 95, 0.72)',
                  }}
                />
              </Box>
            </Box>
            <Box
              component="svg"
              aria-hidden="true"
              viewBox="0 0 140 34"
              sx={{
                display: 'block',
                width: { xs: 118, sm: 152 },
                height: { xs: 30, sm: 36 },
                mx: 'auto',
                mb: { xs: 0.08, sm: 0.22 },
                color: 'secondary.main',
                opacity: 0.96,
                filter: 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.5))',
              }}
            >
              <path d="M4 18H43" stroke="currentColor" strokeWidth="1.05" opacity="0.72" />
              <path d="M97 18H136" stroke="currentColor" strokeWidth="1.05" opacity="0.72" />
              <path d="M56 8L69.5 29L63.5 9.5Z" fill="currentColor" opacity="0.62" />
              <path d="M84 8L70.5 29L76.5 9.5Z" fill="currentColor" opacity="0.62" />
              <path d="M63.5 5.5L70 29L76.5 5.5Z" fill="currentColor" opacity="0.78" />
              <path d="M51 10L70 29L89 10L70 15Z" fill="none" stroke="currentColor" strokeWidth="1.55" />
              <path d="M58 11L70 29L82 11" fill="none" stroke="rgba(7, 8, 10, 0.52)" strokeWidth="1.1" />
              <path d="M66 13L70 29L74 13" fill="none" stroke="rgba(7, 8, 10, 0.45)" strokeWidth="0.9" />
            </Box>
            {session && <JoinCodeDisplay code={session.join_code} />}
          </Box>

          {session && (
            <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: { xs: 'min(100%, 300px)', sm: 368 },
                    aspectRatio: '1 / 1',
                    mx: 'auto',
                    backgroundImage: 'url("/lobby-qr-frame.png")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: '100% 100%',
                    filter: 'drop-shadow(0 18px 42px rgba(0, 0, 0, 0.52))',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: { xs: 42, sm: 52 },
                      bgcolor: '#f5f1e7',
                      borderRadius: 0.55,
                      boxShadow: 'inset 0 0 0 1px rgba(7, 8, 10, 0.12)',
                      pointerEvents: 'none',
                    },
                    '& svg': {
                      position: 'absolute',
                      top: { xs: 48, sm: 60 },
                      left: { xs: 48, sm: 60 },
                      display: 'block',
                      width: { xs: 'calc(100% - 96px)', sm: 'calc(100% - 120px)' },
                      height: { xs: 'calc(100% - 96px)', sm: 'calc(100% - 120px)' },
                      zIndex: 1,
                    },
                  }}
                >
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${session.join_code}`}
                    size={280}
                    level="H"
                  />
                </Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 1.55, fontWeight: 700 }}
                >
                  Scannez pour rejoindre
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <PlayerList
              players={activePlayers}
              currentPlayerId={currentPlayerId}
              readyStates={readyStates}
              minPlayers={MIN_PLAYERS}
              onRemovePlayer={openRemoveDialog}
            />
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1, mt: 'auto' }}>
            <ReadyStatusBar
              readyCount={voteCount}
              totalPlayers={activePlayers.length}
              canStart={canStart}
              minPlayers={MIN_PLAYERS}
              availableMysteriesCount={availableMysteries.length}
              onRefresh={() => window.location.reload()}
              onQuit={handleQuit}
            />
          </Box>

        </Box>

        <Box
          component="section"
          sx={{
            px: { xs: 0.35, sm: 1.15 },
            py: { xs: 1.2, sm: 1.55 },
            mt: 1.25,
            position: 'relative',
            overflow: 'visible',
            bgcolor: 'transparent',
            boxShadow: 'none',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              insetInline: { xs: 2, sm: 10 },
              height: 12,
              pointerEvents: 'none',
              backgroundImage:
                'linear-gradient(90deg, rgba(184, 150, 95, 0.48) 0 34px, transparent 34px calc(100% - 34px), rgba(184, 150, 95, 0.48) calc(100% - 34px) 100%), linear-gradient(90deg, rgba(184, 150, 95, 0.28) 0 1px, transparent 1px calc(100% - 1px), rgba(184, 150, 95, 0.28) calc(100% - 1px) 100%)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 1px, 100% 100%',
            },
            '&::before': {
              top: 0,
              backgroundPosition: 'center top, center top',
            },
            '&::after': {
              bottom: 0,
              backgroundPosition: 'center bottom, center top',
              opacity: 0.58,
            },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(30px, 1fr) auto minmax(30px, 1fr)',
              alignItems: 'center',
              gap: { xs: 0.7, sm: 1 },
              mb: { xs: 1.15, sm: 1.35 },
              px: { xs: 0.1, sm: 0.4 },
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                position: 'relative',
                height: 12,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  height: '1px',
                  bgcolor: 'rgba(184, 150, 95, 0.34)',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  width: 6,
                  height: 6,
                  border: '1px solid rgba(184, 150, 95, 0.72)',
                  transform: 'translateY(-50%) rotate(45deg)',
                  bgcolor: 'rgba(7, 8, 10, 0.82)',
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  right: 11,
                  top: 2,
                  width: { xs: 22, sm: 42 },
                  height: '1px',
                  bgcolor: 'rgba(184, 150, 95, 0.48)',
                }}
              />
            </Box>
            <Typography
              variant="h5"
              component="h2"
              data-testid="mystery-voting-title"
              sx={{
                textAlign: 'center',
                fontFamily: '"Bahnschrift Condensed", "Bahnschrift SemiCondensed", "Bahnschrift", "Aptos Display", "Segoe UI", sans-serif',
                fontSize: { xs: '1.03rem', sm: '1.18rem' },
                fontWeight: 800,
                letterSpacing: { xs: '0.075em', sm: '0.09em' },
                lineHeight: 1,
                textTransform: 'uppercase',
                color: '#efe5cf',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.58)',
                whiteSpace: 'nowrap',
              }}
            >
              Votez pour le mystère
            </Typography>
            <Box
              aria-hidden="true"
              sx={{
                position: 'relative',
                height: 12,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  height: '1px',
                  bgcolor: 'rgba(184, 150, 95, 0.34)',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  width: 6,
                  height: 6,
                  border: '1px solid rgba(184, 150, 95, 0.72)',
                  transform: 'translateY(-50%) rotate(45deg)',
                  bgcolor: 'rgba(7, 8, 10, 0.82)',
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 11,
                  top: 2,
                  width: { xs: 22, sm: 42 },
                  height: '1px',
                  bgcolor: 'rgba(184, 150, 95, 0.48)',
                }}
              />
            </Box>
          </Box>

          <MysteryVotingList
            mysteries={mysteries}
            availableMysteries={availableMysteries}
            votes={votes}
            myVote={myVote}
            onVote={handleVote}
            hasLanguage={!!session?.language}
            showTitle={false}
          />
        </Box>
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
