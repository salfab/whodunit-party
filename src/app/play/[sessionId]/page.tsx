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
import { QrCode2 as QrCodeIcon, HelpOutline as HelpIcon, FlipCameraAndroid as FlipIcon } from '@mui/icons-material';
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
  AccuseButton,
  RoleRevealCard,
  RoleHelpDialog,
  ScoreboardAndVoting,
} from '@/components/play';
import { MysteryVotingList } from '@/components/shared/MysteryVotingList';

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
  fetchGuiltyPlayer,
  getPlaceholderImage,
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
  const [selectedMystery, setSelectedMystery] = useState<string | null>(null);
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
  
  // Character sheet visibility (hide after accusation) - now using flip card
  const [isFlipped, setIsFlipped] = useState(false);
  
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
      // Automatically flip to results after accusation
      setIsFlipped(true);
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
      
      // Check if mystery changed - if so, reset voting state
      const mysteryChanged = previousMysteryIdRef.current !== null && 
                            previousMysteryIdRef.current !== result.characterSheet.mystery_id;
      
      previousMysteryIdRef.current = result.characterSheet.mystery_id;

      // Handle existing accusation
      if (result.existingAccusation) {
        const { accusedPlayerId, wasCorrect, role, mysteryId } = result.existingAccusation;
        
        if (accusedPlayerId === result.currentPlayer.id) {
          setIsAccused(true);
        }

        const message = getAccusationMessage(
          result.characterSheet.role,
          wasCorrect,
          accusedPlayerId === result.currentPlayer.id
        );

        // Fetch guilty player from secure endpoint
        fetchGuiltyPlayer(sessionId, mysteryId).then(guiltyPlayer => {
          setAccusationResult({
            wasCorrect,
            role,
            gameComplete: false,
            message,
            guiltyPlayer,
          });
        }).catch(err => {
          console.error('Error fetching guilty player:', err);
          setErrorSnackbar({ open: true, message: 'Erreur lors du chargement du coupable' });
          // Set accusation result without guilty player
          setAccusationResult({
            wasCorrect,
            role,
            gameComplete: false,
            message,
          });
        });
      } else {
        setAccusationResult(null);
        setIsAccused(false);
        
        // If there's no accusation result and mystery changed, 
        // it means we just started a new round, so reset voting state
        if (mysteryChanged) {
          console.log('New mystery detected, resetting voting state');
          setHasVoted(false);
          setSelectedMystery('');
          setVoteCounts({});
          setAvailableMysteries([]);
          setIsFlipped(false); // Flip back to character sheet for new round
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading character sheet:', err);
      setError(err.message || 'Failed to load character sheet');
      setLoading(false);
    }
  }

  async function loadPostAccusationData() {
    try {
      const scores = await loadScoreboard(sessionId);
      setPlayerScores(scores);

      if (currentPlayer?.id) {
        const result = await loadAvailableMysteries(sessionId, currentPlayer.id);
        setAvailableMysteries(result.mysteries);
        setVoteCounts(result.voteCounts);
        setSelectedMystery(result.selectedMystery);
        setHasVoted(result.hasVoted);
        console.log('Loaded voting state:', { hasVoted: result.hasVoted, selectedMystery: result.selectedMystery, voteCounts: result.voteCounts });
      }
    } catch (err: any) {
      console.error('Error loading post-accusation data:', err);
      setErrorSnackbar({ open: true, message: 'Erreur lors du chargement des données' });
    }
  }

  function getAccusationMessage(role: string, wasCorrect: boolean, _isMe: boolean): string {
    if (role === 'investigator') {
      return wasCorrect 
        ? 'Bravo ! Vous avez trouvé le coupable ! +2 points'
        : 'Erreur ! Vous avez accusé une personne innocente.';
    } else if (role === 'guilty') {
      return wasCorrect
        ? 'Vous avez été découvert par l\'enquêteur.'
        : 'Le coupable n\'a pas été attrapé ! +2 points';
    } else {
      // Innocent - all innocents get +1 when investigator is wrong
      return wasCorrect
        ? 'L\'enquêteur a trouvé le coupable.'
        : 'L\'enquêteur s\'est trompé ! +1 point pour tous les innocents';
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
        guiltyPlayer: data.guiltyPlayer,
      });

      setAccuseDialogOpen(false);
    } catch (err: any) {
      console.error('Error submitting accusation:', err);
      setErrorSnackbar({ open: true, message: err.message || 'Erreur lors de l\'accusation' });
    } finally {
      setSubmittingAccusation(false);
    }
  }

  async function handleVoteForMystery(mysteryId: string | null) {
    if (!mysteryId) {
      // Unvoting - just reset local state
      setSelectedMystery(null);
      setHasVoted(false);
      return;
    }

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
          <Alert severity="info">Chargement de la fiche personnage...</Alert>
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
        {/* Flip Card Container */}
        <Box
          sx={{
            perspective: '2000px',
            transformStyle: 'preserve-3d',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front of card - Character Sheet */}
            <Box
              sx={{
                backfaceVisibility: 'hidden',
                position: 'relative',
              }}
            >
              <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
                {/* Top Right Action Icons */}
                <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
                  {accusationResult && (
                    <IconButton
                      size="small"
                      onClick={() => setIsFlipped(true)}
                      sx={{ 
                        color: 'primary.main',
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'background.paper', transform: 'scale(1.1)' },
                      }}
                      title="Voir les résultats"
                    >
                      <FlipIcon fontSize="small" />
                    </IconButton>
                  )}
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
                  mt: 4
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
                        : getPlaceholderImage(characterSheet.playerIndex))
                    }
                    characterName={characterSheet.character_name}
                    occupation={characterSheet.occupation || undefined}
                    role={characterSheet.role as 'investigator' | 'guilty' | 'innocent'}
                    showNameOverlay={!characterSheet.image_path}
                    isAccused={isAccused}
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

                {/* J'Accuse Button - Only for investigator */}
                {characterSheet.role === 'investigator' && !accusationResult && (
                  <AccuseButton
                    onClick={() => {
                      setSelectedPlayer('');
                      setAccuseDialogOpen(true);
                    }}
                  />
                )}

              </Paper>
            </Box>

            {/* Back of card - Results (Guilty Reveal + Scoreboard) */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {accusationResult && !accusationResult.gameComplete && (
                <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
                  {/* Flip back icon */}
                  <IconButton
                    onClick={() => setIsFlipped(false)}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      color: 'primary.main',
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        bgcolor: 'background.paper',
                        transform: 'scale(1.1)',
                      },
                    }}
                    title="Voir ma fiche personnage"
                  >
                    <FlipIcon />
                  </IconButton>

                  {/* Guilty Player Reveal */}
                  {accusationResult.guiltyPlayer && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
                        🎭 Le Coupable Révélé
                      </Typography>
                      <RoleRevealCard
                        imagePath={
                          accusationResult.guiltyPlayer.imagePath || 
                          getPlaceholderImage(accusationResult.guiltyPlayer.playerIndex)
                        }
                        characterName={accusationResult.guiltyPlayer.characterName}
                        occupation={accusationResult.guiltyPlayer.occupation}
                        role="guilty"
                        showNameOverlay={!accusationResult.guiltyPlayer.imagePath}
                        isAccused={true}
                      />
                      
                      <Alert
                        severity={accusationResult.wasCorrect ? 'success' : 'error'}
                        sx={{ mt: 3 }}
                        data-testid="accusation-result"
                      >
                        {accusationResult.message}
                      </Alert>
                    </Box>
                  )}

                  {/* Scoreboard and Mystery Voting */}
                  <ScoreboardAndVoting
                    playerScores={playerScores}
                    currentPlayerId={currentPlayer?.id}
                    availableMysteries={availableMysteries}
                    myVote={selectedMystery || null}
                    voteCounts={voteCounts}
                    hasVoted={false}
                    startingNextRound={startingNextRound}
                    onVote={handleVoteForMystery}
                    allowUnvote={true}
                  />

                  {/* No mysteries available */}
                  {availableMysteries.length === 0 && (
                    <Alert severity="info" sx={{ mt: 4 }}>
                      Aucun mystère disponible pour continuer. La partie est terminée !
                    </Alert>
                  )}
                </Paper>
              )}
            </Box>
          </Box>
        </Box>

        {/* Game Complete - Outside flip card */}
        {accusationResult && accusationResult.gameComplete && (
          <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
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
          </Paper>
        )}

        <Alert severity="warning" sx={{ mt: 4 }}>
          Gardez votre fiche de personnage secrète des autres joueurs !
        </Alert>

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
