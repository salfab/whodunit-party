'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Alert,
  Chip,
  Snackbar,
  IconButton,
} from '@mui/material';
import { QrCode2 as QrCodeIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { usePlayerHeartbeat } from '@/hooks/usePlayerHeartbeat';
import LoadingScreen from '@/components/LoadingScreen';
import TransitionScreen from '@/components/TransitionScreen';
import MysteryCard from '@/components/shared/MysteryCard';
import RoomQRCodeDialog from '@/components/shared/RoomQRCodeDialog';
import {
  SecretPanel,
  WordsToPlace,
  Scoreboard,
  AccusationDialog,
  AccusedOverlay,
  MysteryVoting,
  AccuseButton,
  RoleRevealCard,
} from '@/components/play';
import type { Database } from '@/types/database';

type CharacterSheet = Database['public']['Tables']['character_sheets']['Row'];
type Player = Database['public']['Tables']['players']['Row'];
type Mystery = Database['public']['Tables']['mysteries']['Row'];

interface PlayerOption {
  id: string;
  name: string;
  characterName?: string;
}

interface CharacterWithWords extends CharacterSheet {
  wordsToPlace: string[];
  mystery: Mystery;
}

interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

interface AvailableMystery {
  id: string;
  title: string;
  cover_image_url?: string;
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
  const [showTransition, setShowTransition] = useState(false);
  const [transitionTitle, setTransitionTitle] = useState('');
  const [transitionSubtitle, setTransitionSubtitle] = useState('');
  const [transitionImageUrl, setTransitionImageUrl] = useState<string | undefined>(undefined);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  const currentPlayerRef = useRef(currentPlayer);
  const previousMysteryIdRef = useRef<string | null>(null);

  const supabase = createClient();

  // Send heartbeats to keep player active
  usePlayerHeartbeat(currentPlayer?.id || null, true);

  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  useEffect(() => {
    loadCharacterSheet();
    setupRealtimeSubscription();
  }, [sessionId]);

  useEffect(() => {
    let cleanupVotes: (() => void) | undefined;

    if (accusationResult && !accusationResult.gameComplete) {
      // Load scoreboard and available mysteries for voting
      loadScoreboard();
      loadAvailableMysteries();
      cleanupVotes = setupVoteSubscription();
    }

    return () => {
      if (cleanupVotes) cleanupVotes();
    };
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

      // Get current session to know the current mystery
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('current_mystery_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData?.current_mystery_id) {
         console.error('Could not determine current mystery', sessionError);
         // Fallback or retry? For now let's throw to trigger error state
         throw new Error('Could not determine current mystery');
      }
      const currentMysteryId = sessionData.current_mystery_id;

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
          .eq('mystery_id', currentMysteryId)
          .maybeSingle();

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

      // Load all active players with their character names (for accusation list)
      const { data: allPlayers } = await supabase
        .from('players')
        .select(`
          id, 
          name, 
          status,
          player_assignments!inner(
            character_sheets!inner(
              character_name
            )
          )
        `)
        .eq('session_id', sessionId)
        .eq('status', 'active');

      // Filter out the current player (investigator can't accuse themselves) and format data
      const otherPlayers = allPlayers?.filter((p) => p.id !== playerData.playerId).map((p: any) => ({
        id: p.id,
        name: p.name,
        characterName: p.player_assignments?.[0]?.character_sheets?.character_name
      })) || [];
      setPlayers(otherPlayers);

      // Get round number by counting player's assignments in this session
      // Each round = one assignment, so count of assignments = current round number
      const { data: allAssignments } = await supabase
        .from('player_assignments')
        .select('mystery_id')
        .eq('session_id', sessionId)
        .eq('player_id', playerData.playerId);
      
      const roundNumber = allAssignments?.length || 1;

      // Track mystery changes for transitions
      if (sheet.mystery_id && previousMysteryIdRef.current && previousMysteryIdRef.current !== sheet.mystery_id) {
        // Mystery changed - show transition
        setTransitionTitle(mystery.title);
        setTransitionSubtitle(`Manche ${roundNumber}`);
        setTransitionImageUrl(mystery.image_path || undefined);
        setShowTransition(true);
      }
      previousMysteryIdRef.current = sheet.mystery_id;

      // Check if there's already an accusation for THIS mystery
      const { data: existingRound, error: roundError } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sessionId)
        .eq('mystery_id', mystery.id)
        .maybeSingle();

      if (!roundError && existingRound) {
        // Check if I am the accused player in this round
        if (existingRound.accused_player_id === playerData.playerId) {
          setIsAccused(true);
        }

        let message = '';
        const wasCorrect = existingRound.was_correct;
        const isMe = existingRound.accused_player_id === playerData.playerId;
        
        if (sheet.role === 'investigator') {
          message = wasCorrect 
            ? 'Bravo ! Vous avez trouvé le coupable ! +2 points'
            : 'Erreur ! Vous avez accusé une personne innocente.';
        } else if (sheet.role === 'guilty') {
          message = wasCorrect
            ? 'Vous avez été découvert par l\'enquêteur.'
            : 'Le coupable n\'a pas été attrapé ! +2 points';
        } else {
          // Innocent
          message = wasCorrect
            ? 'L\'enquêteur a trouvé le coupable.'
            : (isMe
                ? 'Vous êtes innocent et avez été accusé à tort ! +1 point'
                : 'L\'enquêteur s\'est trompé.');
        }

        setAccusationResult({
          wasCorrect: existingRound.was_correct,
          role: existingRound.was_correct ? 'guilty' : 'innocent',
          gameComplete: false,
          message
        });
      } else {
        // No round for this mystery, ensure accusation result is cleared
        setAccusationResult(null);
        setIsAccused(false);
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
        .eq('status', 'active')
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
      // Get session info for language filtering
      const { data: sessionData } = await supabase
        .from('game_sessions')
        .select('language')
        .eq('id', sessionId)
        .single();
      
      const language = sessionData?.language || 'fr';

      // Get active player count for filtering by character_count
      const { data: activePlayers } = await supabase
        .from('players')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'active');
      
      const playerCount = activePlayers?.length || 0;

      // Get mysteries filtered by language and including character count
      const mysteriesResponse = await fetch(`/api/mysteries?language=${language}&includeCharacterCount=true`);
      if (!mysteriesResponse.ok) {
        throw new Error('Failed to fetch mysteries');
      }
      const data = await mysteriesResponse.json();
      const allMysteries = data.mysteries || [];

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
      
      // Filter: not played AND has enough characters for current player count
      const available = allMysteries.filter((m: any) => 
        !playedIds.has(m.id) && m.character_count >= playerCount
      ).map((m: any) => ({
        id: m.id,
        title: m.title,
        cover_image_url: m.image_path
      }));

      setAvailableMysteries(available);

      // Load current vote counts
      const tallyResponse = await fetch(`/api/sessions/${sessionId}/tally-votes`);
      if (tallyResponse.ok) {
        const { voteCounts: currentVotes, roundNumber } = await tallyResponse.json();
        setVoteCounts(currentVotes || {});

        // Check if current player has already voted for this round
        if (currentPlayer?.id && roundNumber) {
          const { data: existingVote } = await supabase
            .from('mystery_votes')
            .select('mystery_id')
            .eq('session_id', sessionId)
            .eq('player_id', currentPlayer.id)
            .eq('round_number', roundNumber)
            .maybeSingle();

          if (existingVote?.mystery_id) {
            setSelectedMystery(existingVote.mystery_id);
            setHasVoted(true);
          } else {
            setSelectedMystery('');
            setHasVoted(false);
          }
        } else {
          setSelectedMystery('');
          setHasVoted(false);
        }
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
    } catch (err: any) {
      console.error('Error voting:', err);
      setErrorSnackbar({ open: true, message: err.message || 'Erreur lors du vote' });
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
    
    const channel = supabase
      .channel(`room-${sessionId}`)
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
          loadCharacterSheet();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rounds',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('Round created:', payload.new);
          loadCharacterSheet();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_assignments',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('Assignment changed:', payload.eventType, payload.new);
          if (payload.eventType === 'DELETE') {
            console.log('Assignment deleted, skipping reload to avoid race condition');
            return; // Don't reload on DELETE to avoid race condition
          }
          // Only reload on INSERT or UPDATE
          loadCharacterSheet();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('Session updated via broadcast:', payload.new);
          loadCharacterSheet();
        }
      )
      .subscribe((status, err) => {
        console.log('Realtime connection status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to game updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Realtime connection timed out');
        }
      });

    return () => {
      console.log('Cleaning up play page realtime subscription');
      supabase.removeChannel(channel);
    };
  }

  if (loading) {
    return <LoadingScreen message="Chargement de votre personnage" />;
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
      if (characterSheet?.role === 'investigator') {
        message = data.messages.investigator;
      } else if (characterSheet?.role === 'guilty') {
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
        <AccusedOverlay isAccused={isAccused} />

        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Character Header with Name and Image */}
          <Box sx={{ 
            mb: 4,
            pb: 3,
            borderBottom: '2px solid',
            borderColor: 'primary.main'
          }}>
            {/* Mystery Title */}
            <Box sx={{ mb: 3, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'primary.main',
                  fontStyle: 'italic',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                {characterSheet.mystery.title}
              </Typography>
              {joinCode && (
                <IconButton
                  size="small"
                  onClick={() => setQrDialogOpen(true)}
                  sx={{ color: 'secondary.main' }}
                  title="Afficher le QR code"
                >
                  <QrCodeIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <RoleRevealCard
              imagePath={
                characterSheet.image_path || 
                (characterSheet.role === 'investigator' 
                  ? '/characters/investigator.jpg' 
                  : '/characters/suspect.jpg')
              }
              characterName={characterSheet.character_name}
              role={characterSheet.role as 'investigator' | 'guilty' | 'innocent'}
              showNameOverlay={!characterSheet.image_path}
            />
          </Box>

          {/* Investigator sees Mystery Description */}
          {characterSheet.role === 'investigator' && (
            <Box sx={{ 
              mb: 4,
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                color: 'primary.main',
                fontWeight: 600,
                mt: 3,
                mb: 2,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)'
              },
              '& p': {
                color: 'text.primary',
                fontSize: '1.1rem',
                lineHeight: 1.8,
                mb: 2,
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              },
              '& ul, & ol': {
                color: 'text.primary',
                fontSize: '1.1rem',
                lineHeight: 1.8,
                pl: 3,
                mb: 2
              },
              '& li': {
                mb: 1,
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              },
              '& strong': {
                color: 'primary.light',
                fontWeight: 700
              },
              '& em': {
                color: 'primary.main',
                fontStyle: 'italic'
              },
              '& code': {
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                color: 'primary.main',
                padding: '2px 6px',
                borderRadius: '4px'
              }
            }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 600,
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  mb: 3
                }}
              >
                📖 Description du mystère
              </Typography>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {characterSheet.mystery.description}
              </ReactMarkdown>
            </Box>
          )}

          {/* Dark Secret - Only for guilty/innocent */}
          {/* Dark Secret - Only for guilty/innocent */}
          {characterSheet.role !== 'investigator' && (
            <SecretPanel
              title="Sombre Secret"
              emoji="🤫"
              content={characterSheet.dark_secret}
              visible={secretVisible}
              onToggleVisibility={() => setSecretVisible(!secretVisible)}
            />
          )}

          {/* Words to Place - Only for guilty/innocent */}
          {characterSheet.role !== 'investigator' && (
            <WordsToPlace words={characterSheet.wordsToPlace} />
          )}

          {/* Alibi - Only for guilty/innocent */}
          {characterSheet.role !== 'investigator' && (
            <SecretPanel
              title="Votre alibi"
              emoji="🕵️"
              content={characterSheet.alibi}
              visible={alibiVisible}
              onToggleVisibility={() => setAlibiVisible(!alibiVisible)}
            />
          )}

          {/* J'Accuse Button - Only for investigator */}
          {characterSheet.role === 'investigator' && !accusationResult && (
            <AccuseButton
              onClick={() => {
                setSelectedPlayer('');
                setAccuseDialogOpen(true);
              }}
            />
          )}

          {accusationResult && (
            <Alert
              severity={accusationResult.wasCorrect ? 'success' : 'error'}
              sx={{ mt: 4 }}
              data-testid="accusation-result"
            >
              {accusationResult.message}
            </Alert>
          )}

          {/* Scoreboard and Mystery Voting - shown after accusation unless game is complete */}
          {accusationResult && !accusationResult.gameComplete && (
            <>
              {/* Scoreboard */}
              <Scoreboard
                playerScores={playerScores}
                currentPlayerId={currentPlayer?.id}
              />

              {/* Mystery Voting */}
              <MysteryVoting
                availableMysteries={availableMysteries}
                selectedMystery={selectedMystery}
                voteCounts={voteCounts}
                hasVoted={hasVoted}
                startingNextRound={startingNextRound}
                onVote={handleVoteForMystery}
              />

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
              <Scoreboard
                playerScores={playerScores}
                currentPlayerId={currentPlayer?.id}
                title=""
              />
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 4 }}>
            ⚠️ Gardez votre fiche de personnage secrète des autres joueurs !
          </Alert>
        </Paper>

        {/* Accusation Dialog */}
        <AccusationDialog
          open={accuseDialogOpen}
          onClose={() => setAccuseDialogOpen(false)}
          players={players}
          selectedPlayer={selectedPlayer}
          onSelectPlayer={setSelectedPlayer}
          onConfirm={handleAccuse}
          submitting={submittingAccusation}
        />
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={errorSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setErrorSnackbar({ open: false, message: '' })}
        message={errorSnackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Mystery Transition Screen */}
      <TransitionScreen
        isVisible={showTransition}
        title={transitionTitle}
        subtitle={transitionSubtitle}
        imageUrl={transitionImageUrl}
        onComplete={() => setShowTransition(false)}
        duration={2500}
      />

      {/* QR Code Dialog */}
      <RoomQRCodeDialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        joinCode={joinCode}
      />
    </Container>
  );
}
