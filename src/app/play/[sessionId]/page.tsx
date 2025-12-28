'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  Alert,
  Snackbar,
  IconButton,
  Typography,
} from '@mui/material';
import { QrCode2 as QrCodeIcon, HelpOutline as HelpIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePlayerHeartbeat } from '@/hooks/usePlayerHeartbeat';
import LoadingScreen from '@/components/LoadingScreen';
import TransitionScreen from '@/components/TransitionScreen';
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
  RoleHelpDialog,
} from '@/components/play';

import { HELP_CONTENT } from './constants';
import type {
  CharacterWithWords,
  PlayerOption,
  PlayerScore,
  AvailableMystery,
  AccusationResult,
} from './types';
import {
  loadCharacterSheet,
  loadScoreboard,
  loadAvailableMysteries,
  submitAccusation,
  submitMysteryVote,
} from './api';
import { setupRealtimeSubscription, setupVoteSubscription } from './realtime';

export default function PlayPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  // Player state
  const [currentPlayer, setCurrentPlayer] = useState<{ id: string; name: string } | null>(null);
  const [characterSheet, setCharacterSheet] = useState<CharacterWithWords | null>(null);
  const [isAccused, setIsAccused] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [secretVisible, setSecretVisible] = useState(false);
  const [alibiVisible, setAlibiVisible] = useState(false);
  
  // Accusation state
  const [accuseDialogOpen, setAccuseDialogOpen] = useState(false);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [accusationResult, setAccusationResult] = useState<AccusationResult | null>(null);
  const [submittingAccusation, setSubmittingAccusation] = useState(false);
  
  // Voting state
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [availableMysteries, setAvailableMysteries] = useState<AvailableMystery[]>([]);
  const [selectedMystery, setSelectedMystery] = useState<string>('');
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [startingNextRound, setStartingNextRound] = useState(false);
  
  // Notifications
  const [errorSnackbar, setErrorSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  
  // Transitions
  const [showTransition, setShowTransition] = useState(false);
  const [transitionTitle, setTransitionTitle] = useState('');
  const [transitionSubtitle, setTransitionSubtitle] = useState('');
  const [transitionImageUrl, setTransitionImageUrl] = useState<string | undefined>(undefined);
  
  // Dialogs
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Refs
  const previousMysteryIdRef = useRef<string | null>(null);

  // Send heartbeats to keep player active
  usePlayerHeartbeat(currentPlayer?.id || null, true);

  useEffect(() => {
    loadData();
    const cleanup = setupRealtimeSubscription(sessionId, loadData);
    return cleanup;
  }, [sessionId]);

  useEffect(() => {
    let cleanupVotes: (() => void) | undefined;

    if (accusationResult && !accusationResult.gameComplete) {
      loadPostAccusationData();
      cleanupVotes = setupVoteSubscription(sessionId, setVoteCounts);
    }

    return () => {
      if (cleanupVotes) cleanupVotes();
    };
  }, [accusationResult]);

  async function loadData() {
    try {
      const result = await loadCharacterSheet(sessionId, previousMysteryIdRef.current);
      
      setCurrentPlayer(result.currentPlayer);
      setCharacterSheet(result.characterSheet);
      setPlayers(result.otherPlayers);
      if (result.joinCode) setJoinCode(result.joinCode);

      // Handle transition
      if (result.transitionData) {
        setTransitionTitle(result.transitionData.title);
        setTransitionSubtitle(result.transitionData.subtitle);
        setTransitionImageUrl(result.transitionData.imageUrl);
        setShowTransition(true);
      }
      previousMysteryIdRef.current = result.characterSheet.mystery_id;

      // Handle existing accusation
      if (result.existingAccusation) {
        const { accusedPlayerId, wasCorrect, role } = result.existingAccusation;
        
        if (accusedPlayerId === result.currentPlayer.id) {
          setIsAccused(true);
        }

        const message = getAccusationMessage(
          result.characterSheet.role,
          wasCorrect,
          accusedPlayerId === result.currentPlayer.id
        );

        setAccusationResult({
          wasCorrect,
          role,
          gameComplete: false,
          message,
        });
      } else {
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

  async function loadPostAccusationData() {
    const scores = await loadScoreboard(sessionId);
    setPlayerScores(scores);

    if (currentPlayer?.id) {
      const result = await loadAvailableMysteries(sessionId, currentPlayer.id);
      setAvailableMysteries(result.mysteries);
      setVoteCounts(result.voteCounts);
      setSelectedMystery(result.selectedMystery);
      setHasVoted(result.hasVoted);
    }
  }

  function getAccusationMessage(role: string, wasCorrect: boolean, isMe: boolean): string {
    if (role === 'investigator') {
      return wasCorrect 
        ? 'Bravo ! Vous avez trouvé le coupable ! +2 points'
        : 'Erreur ! Vous avez accusé une personne innocente.';
    } else if (role === 'guilty') {
      return wasCorrect
        ? 'Vous avez été découvert par l\'enquêteur.'
        : 'Le coupable n\'a pas été attrapé ! +2 points';
    } else {
      // Innocent
      return wasCorrect
        ? 'L\'enquêteur a trouvé le coupable.'
        : (isMe
            ? 'Vous êtes innocent et avez été accusé à tort ! +1 point'
            : 'L\'enquêteur s\'est trompé.');
    }
  }

  async function handleAccuse() {
    if (!selectedPlayer || !characterSheet) return;

    setSubmittingAccusation(true);

    try {
      const data = await submitAccusation(selectedPlayer);

      const message = characterSheet.role === 'investigator'
        ? data.messages.investigator
        : characterSheet.role === 'guilty'
        ? data.messages.guilty
        : data.messages.innocent;

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

  async function handleVoteForMystery(mysteryId: string) {
    try {
      await submitMysteryVote(sessionId, mysteryId);
      setSelectedMystery(mysteryId);
      setHasVoted(true);
    } catch (err: any) {
      console.error('Error voting:', err);
      setErrorSnackbar({ open: true, message: err.message || 'Erreur lors du vote' });
    }
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

  const helpContent = characterSheet.role === 'investigator' 
    ? HELP_CONTENT.investigator 
    : characterSheet.role === 'guilty' 
    ? HELP_CONTENT.guilty
    : HELP_CONTENT.innocent;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4, minHeight: '100vh', position: 'relative' }}>
        <AccusedOverlay isAccused={isAccused} />

        <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
          {/* Top Right Action Icons */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => setHelpDialogOpen(true)}
              sx={{ color: 'secondary.main' }}
              title="Comment jouer"
            >
              <HelpIcon fontSize="small" />
            </IconButton>
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

          {/* Character Header */}
          <Box sx={{ 
            mb: 4,
            pb: 3,
            borderBottom: '2px solid',
            borderColor: 'primary.main',
            mt: 6
          }}>
            {/* Mystery Title */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
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
            </Box>

            <RoleRevealCard
              imagePath={
                characterSheet.image_path || 
                (characterSheet.role === 'investigator' 
                  ? '/characters/investigator.jpg' 
                  : '/characters/suspect.jpg')
              }
              characterName={characterSheet.character_name}
              occupation={characterSheet.occupation || undefined}
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

          {/* Scoreboard and Mystery Voting */}
          {accusationResult && !accusationResult.gameComplete && (
            <>
              <Scoreboard
                playerScores={playerScores}
                currentPlayerId={currentPlayer?.id}
              />

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

      <Snackbar
        open={errorSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setErrorSnackbar({ open: false, message: '' })}
        message={errorSnackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <TransitionScreen
        isVisible={showTransition}
        title={transitionTitle}
        subtitle={transitionSubtitle}
        imageUrl={transitionImageUrl}
        onComplete={() => setShowTransition(false)}
        duration={2500}
      />

      <RoomQRCodeDialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        joinCode={joinCode}
      />

      <RoleHelpDialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        helpContent={helpContent}
      />
    </Container>
  );
}
