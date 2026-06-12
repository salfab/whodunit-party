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
  Button,
} from '@mui/material';
import { QrCode2 as QrCodeIcon, HelpOutline as HelpIcon, FlipCameraAndroid as FlipIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePlayerPresence } from '@/hooks/usePlayerPresence';
import LoadingScreen from '@/components/LoadingScreen';
import TransitionScreen from '@/components/TransitionScreen';
import RoomQRCodeDialog from '@/components/shared/RoomQRCodeDialog';
import { DecoFrame } from '@/components/shared/DecoFrame';
import { DecoDivider } from '@/components/shared/DecoDivider';
import { DecoRubric } from '@/components/shared/DecoRubric';
import {
  SecretPanel,
  WordsToPlace,
  Scoreboard,
  AccusationDialog,
  AccuseButton,
  RoleRevealCard,
  RoleHelpDialog,
  ScoreboardAndVoting,
  ConfessionDialog,
  MysteryFeedbackForm,
} from '@/components/play';
import type { MysteryFeedbackPayload } from '@/components/play/MysteryFeedbackForm';

import { HELP_CONTENT } from './constants';
import type {
  CharacterWithWords,
  PlayerOption,
  PlayerScore,
  AvailableMystery,
  AccusationResult,
  SuspectInfo,
} from './types';
import {
  loadCharacterSheet,
  loadScoreboard,
  loadAvailableMysteries,
  submitAccusation,
  submitMysteryVote,
  submitMysteryFeedback,
  fetchGuiltyPlayer,
  fetchRoundWords,
  fetchSuspects,
  getPlaceholderImage,
} from './api';
import SuspectsList from './components/SuspectsList';
import { setupRealtimeSubscription, setupVoteSubscription } from './realtime';

export default function PlayPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  // Player state
  const [currentPlayer, setCurrentPlayer] = useState<{ id: string; name: string } | null>(null);
  const [characterSheet, setCharacterSheet] = useState<CharacterWithWords | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alibiVisible, setAlibiVisible] = useState(false);
  
  // Accusation state
  const [accuseDialogOpen, setAccuseDialogOpen] = useState(false);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [suspects, setSuspects] = useState<SuspectInfo[]>([]);
  const [accusationResult, setAccusationResult] = useState<AccusationResult | null>(null);
  const [submittingAccusation, setSubmittingAccusation] = useState(false);
  
  // Voting state
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [availableMysteries, setAvailableMysteries] = useState<AvailableMystery[]>([]);
  const [selectedMystery, setSelectedMystery] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [startingNextRound] = useState(false);
  const [loadingMysteries, setLoadingMysteries] = useState(false);

  // End-of-mystery feedback state
  const [roundWords, setRoundWords] = useState<string[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
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
  const [confessionDialogOpen, setConfessionDialogOpen] = useState(false);
  
  // Refs
  const previousMysteryIdRef = useRef<string | null>(null);

  // Track player presence using Supabase Presence (no database updates)
  usePlayerPresence(sessionId, currentPlayer?.id || null, currentPlayer?.name || null, true);

  // Handle accusation event from realtime - lightweight, no full reload
  const handleAccusationEvent = async (round: {
    mystery_id: string;
    accused_player_id: string;
    was_correct: boolean;
  }) => {
    console.log('Accusation event received:', round);
    
    // Skip if we already have an accusation result (we're the investigator who just submitted)
    if (accusationResult) {
      console.log('Already have accusation result, skipping');
      return;
    }
    
    // Check if this accusation is for the current mystery
    if (characterSheet && round.mystery_id !== characterSheet.mystery_id) {
      console.log('Accusation is for different mystery, skipping');
      return;
    }

    // Build accusation message based on role
    const message = characterSheet 
      ? getAccusationMessage(characterSheet.assignedRole, round.was_correct)
      : '';

    // Fetch guilty player from secure endpoint
    try {
      const guiltyPlayer = await fetchGuiltyPlayer(sessionId, round.mystery_id);
      setAccusationResult({
        wasCorrect: round.was_correct,
        role: round.was_correct ? 'guilty' : 'innocent',
        gameComplete: false,
        message,
        guiltyPlayer,
      });
    } catch (err) {
      console.error('Error fetching guilty player:', err);
      setErrorSnackbar({ open: true, message: 'Erreur lors du chargement du coupable' });
      // Set accusation result without guilty player
      setAccusationResult({
        wasCorrect: round.was_correct,
        role: round.was_correct ? 'guilty' : 'innocent',
        gameComplete: false,
        message,
      });
    }
  };

  useEffect(() => {
    loadData();
    const cleanup = setupRealtimeSubscription(sessionId, loadData, handleAccusationEvent);
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

  // The 6 round words only exist server-side until the accusation; fetch them
  // for the feedback form once the round is over.
  useEffect(() => {
    if (accusationResult && !accusationResult.gameComplete && characterSheet?.mystery?.id) {
      fetchRoundWords(sessionId, characterSheet.mystery.id)
        .then(setRoundWords)
        .catch((err) => {
          console.error('Error fetching round words:', err);
          setRoundWords([]);
        });
    }
  }, [accusationResult, characterSheet?.mystery?.id, sessionId]);

  async function loadData() {
    try {
      const result = await loadCharacterSheet(sessionId, previousMysteryIdRef.current);
      
      setCurrentPlayer(result.currentPlayer);
      setCharacterSheet(result.characterSheet);
      setPlayers(result.otherPlayers);
      if (result.joinCode) setJoinCode(result.joinCode);

      // Fetch suspects for investigator
      if (result.characterSheet.assignedRole === 'investigator') {
        fetchSuspects(sessionId).then(suspectList => {
          setSuspects(suspectList);
        }).catch(err => {
          console.error('Error fetching suspects:', err);
        });
      } else {
        setSuspects([]);
      }

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
        const { wasCorrect, role, mysteryId } = result.existingAccusation;
        
        const message = getAccusationMessage(
          result.characterSheet.assignedRole,
          wasCorrect
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
        
        // If there's no accusation result and mystery changed, 
        // it means we just started a new round, so reset voting state
        if (mysteryChanged) {
          console.log('New mystery detected, resetting voting state');
          setHasVoted(false);
          setSelectedMystery('');
          setVoteCounts({});
          setAvailableMysteries([]);
          setRoundWords([]);
          setFeedbackSubmitted(false);
          setIsFlipped(false); // Flip back to character sheet for new round
          
          // Scroll to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setLoadingMysteries(true);
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
    } finally {
      setLoadingMysteries(false);
    }
  }

  async function handleSubmitFeedback(payload: MysteryFeedbackPayload) {
    if (!characterSheet?.mystery?.id) return;
    try {
      await submitMysteryFeedback(sessionId, characterSheet.mystery.id, payload);
      setFeedbackSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setErrorSnackbar({ open: true, message: err.message || 'Erreur lors de l\'envoi du retour' });
    }
  }

  function getAccusationMessage(role: string, wasCorrect: boolean): string {
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

  async function handleAccuse(playerId: string) {
    if (!playerId || !characterSheet) return;

    setSubmittingAccusation(true);

    try {
      const data = await submitAccusation(playerId);

      const message = characterSheet.assignedRole === 'investigator'
        ? data.messages.investigator
        : characterSheet.assignedRole === 'guilty'
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
      
      // Scroll to top to see the accusation result
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const helpContent = characterSheet.assignedRole === 'investigator'
    ? HELP_CONTENT.investigator
    : characterSheet.assignedRole === 'guilty'
    ? HELP_CONTENT.guilty
    : HELP_CONTENT.innocent;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: { xs: 2, sm: 4 }, minHeight: '100svh', position: 'relative' }}>
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
              <Paper
                elevation={3}
                sx={{
                  px: { xs: 3, sm: 4 },
                  pt: { xs: 4, sm: 4.5 },
                  pb: { xs: 5, sm: 6 },
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <DecoFrame />
                {/* Top action row */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Typography
                    component="div"
                    sx={{
                      fontFamily: '"Bahnschrift", "Aptos Display", "Segoe UI", sans-serif',
                      fontWeight: 700,
                      color: 'secondary.light',
                      fontSize: '0.95rem',
                    }}
                  >
                    Faux Témoignage
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                  {accusationResult && (
                    <IconButton
                      size="small"
                      onClick={() => setIsFlipped(true)}
                      sx={{ 
                        color: 'secondary.main',
                        bgcolor: 'rgba(7, 8, 10, 0.42)',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'rgba(184, 150, 95, 0.1)', transform: 'scale(1.05)' },
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
                </Box>

                {/* Character Header */}
                <Box sx={{ mb: 3 }}>
                  {/* Mystery Title */}
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: '"Lobby Deco Display", "Bodoni MT Condensed", "Bodoni MT", serif',
                        color: 'secondary.light',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        textShadow: '0 2px 8px rgba(0,0,0,0.45)',
                        mb: 1,
                      }}
                    >
                      {characterSheet.mystery.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      component="h1"
                      sx={{
                        fontFamily: '"Bahnschrift Condensed", "Bahnschrift SemiCondensed", "Bahnschrift", "Aptos Display", "Segoe UI", sans-serif',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: '#efe5cf',
                        textShadow: '0 6px 18px rgba(0, 0, 0, 0.62)',
                      }}
                    >
                      Votre personnage
                    </Typography>
                  </Box>

                  <RoleRevealCard
                    imagePath={
                      characterSheet.image_path ||
                      (characterSheet.assignedRole === 'investigator'
                        ? '/characters/investigator.jpg'
                        : getPlaceholderImage(characterSheet.playerIndex))
                    }
                    characterName={characterSheet.character_name}
                    occupation={characterSheet.occupation || undefined}
                    role={characterSheet.assignedRole as 'investigator' | 'guilty' | 'innocent'}
                    showNameOverlay={!characterSheet.image_path}
                  />

                  <DecoDivider sx={{ mx: 'auto', mt: 3 }} />
                </Box>

                {/* Investigator sees Mystery Description */}
                {characterSheet.assignedRole === 'investigator' && (
                  <Box sx={{ 
                    mb: 4,
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      color: 'secondary.light',
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
                      color: 'secondary.light',
                      fontWeight: 700
                    },
                    '& em': {
                      color: 'secondary.light',
                      fontStyle: 'italic'
                    },
                    '& code': {
                      backgroundColor: 'rgba(184, 150, 95, 0.1)',
                      color: 'secondary.light',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }
                  }}>
                    <DecoRubric component="h2" sx={{ mb: 2.5 }}>
                      Description du mystère
                    </DecoRubric>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {characterSheet.mystery.description}
                    </ReactMarkdown>
                  </Box>
                )}

                {/* Suspects List - Only for investigator */}
                {characterSheet.assignedRole === 'investigator' && suspects.length > 0 && (
                  <SuspectsList suspects={suspects} />
                )}

                {/* Words to Place - Only for guilty/innocent */}
                {characterSheet.assignedRole !== 'investigator' && (
                  <WordsToPlace words={characterSheet.wordsToPlace} />
                )}

                {/* Alibi - Only for guilty/innocent */}
                {characterSheet.assignedRole !== 'investigator' && (
                  <SecretPanel
                    title="En manque d'inspiration ?"
                    content={characterSheet.alibi}
                    visible={alibiVisible}
                    onToggleVisibility={() => setAlibiVisible((visible) => !visible)}
                  />
                )}

                {/* J'Accuse Button - Only for investigator */}
                {characterSheet.assignedRole === 'investigator' && !accusationResult && (
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
                <Paper
                  elevation={3}
                  sx={{
                    px: { xs: 3, sm: 4 },
                    pt: { xs: 4, sm: 4.5 },
                    pb: { xs: 5, sm: 6 },
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <DecoFrame />
                  {/* Top action row */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Typography
                      component="div"
                      sx={{
                        fontFamily: '"Bahnschrift", "Aptos Display", "Segoe UI", sans-serif',
                        fontWeight: 700,
                        color: 'secondary.light',
                        fontSize: '0.95rem',
                      }}
                    >
                      Faux Témoignage
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setIsFlipped(false)}
                      sx={{
                        color: 'secondary.main',
                        bgcolor: 'rgba(7, 8, 10, 0.42)',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'rgba(184, 150, 95, 0.1)', transform: 'scale(1.05)' },
                      }}
                      title="Voir ma fiche personnage"
                    >
                      <FlipIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Guilty Player Reveal */}
                  {accusationResult.guiltyPlayer && (
                    <Box sx={{ mb: 4 }}>
                      <DecoRubric component="h2" align="center" sx={{ mb: 3 }}>
                        Le coupable révélé
                      </DecoRubric>
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

                      {accusationResult.guiltyPlayer.darkSecret && (
                        <Box
                          sx={{
                            mt: 3,
                            pt: 3,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            '& p, & li': {
                              color: 'text.primary',
                              lineHeight: 1.8,
                            },
                            '& strong': {
                              color: 'secondary.light',
                              fontWeight: 700,
                            },
                          }}
                        >
                          <DecoRubric component="h3" sx={{ mb: 1.5 }}>
                            Les aveux du coupable
                          </DecoRubric>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {accusationResult.guiltyPlayer.darkSecret}
                          </ReactMarkdown>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Confession CTA - Only for guilty player */}
                  {characterSheet?.assignedRole === 'guilty' && (
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => setConfessionDialogOpen(true)}
                        data-testid="confession-cta"
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          textTransform: 'none',
                        }}
                      >
                        J&apos;avoue tout !
                      </Button>
                    </Box>
                  )}

                  {/* End-of-mystery feedback (optional, all roles) */}
                  <MysteryFeedbackForm
                    words={roundWords}
                    submitted={feedbackSubmitted}
                    onSubmit={handleSubmitFeedback}
                  />

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
                    loading={loadingMysteries}
                  />

                  {/* No mysteries available - only show after loading completes */}
                  {!loadingMysteries && availableMysteries.length === 0 && (
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
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom>
                Partie terminée !
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

      <ConfessionDialog
        open={confessionDialogOpen}
        onClose={() => setConfessionDialogOpen(false)}
        darkSecret={characterSheet?.dark_secret || ''}
      />
    </Container>
  );
}
