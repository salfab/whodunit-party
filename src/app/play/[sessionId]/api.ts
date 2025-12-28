import { createClient } from '@/lib/supabase/client';
import type { PlayerOption, PlayerScore, AvailableMystery, CharacterWithWords } from './types';

const supabase = createClient();

interface LoadCharacterSheetResult {
  currentPlayer: { id: string; name: string };
  characterSheet: CharacterWithWords;
  otherPlayers: PlayerOption[];
  existingAccusation?: {
    accusedPlayerId: string;
    wasCorrect: boolean;
    role: string;
  };
  transitionData?: {
    title: string;
    subtitle: string;
    imageUrl?: string;
  };
  joinCode?: string;
}

export async function loadCharacterSheet(
  sessionId: string,
  previousMysteryId: string | null
): Promise<LoadCharacterSheetResult> {
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
      throw new Error('Redirecting to join page');
    }
    throw new Error('Not authenticated');
  }
  const playerData = await response.json();
  const currentPlayer = { id: playerData.playerId, name: playerData.name };

  // Get current session to know the current mystery
  const { data: sessionData, error: sessionError } = await supabase
    .from('game_sessions')
    .select('current_mystery_id, join_code')
    .eq('id', sessionId)
    .single();

  if (sessionError || !sessionData?.current_mystery_id) {
    console.error('Could not determine current mystery', sessionError);
    throw new Error('Could not determine current mystery');
  }
  const currentMysteryId = sessionData.current_mystery_id;
  const joinCode = sessionData.join_code;

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
  
  const characterSheet: CharacterWithWords = { ...sheet, wordsToPlace, mystery };

  // Load all active players with their character names (for accusation list)
  const { data: allPlayers } = await supabase
    .from('players')
    .select(`
      id, 
      name, 
      status,
      player_assignments!inner(
        character_sheets!inner(
          character_name,
          occupation
        )
      )
    `)
    .eq('session_id', sessionId)
    .eq('status', 'active');

  // Filter out the current player (investigator can't accuse themselves) and format data
  const otherPlayers = allPlayers?.filter((p) => p.id !== playerData.playerId).map((p: any) => ({
    id: p.id,
    name: p.name,
    characterName: p.player_assignments?.[0]?.character_sheets?.character_name,
    occupation: p.player_assignments?.[0]?.character_sheets?.occupation
  })) || [];

  // Get round number by counting player's assignments in this session
  const { data: allAssignments } = await supabase
    .from('player_assignments')
    .select('mystery_id')
    .eq('session_id', sessionId)
    .eq('player_id', playerData.playerId);
  
  const roundNumber = allAssignments?.length || 1;

  // Check for transition
  let transitionData: LoadCharacterSheetResult['transitionData'];
  if (sheet.mystery_id && previousMysteryId && previousMysteryId !== sheet.mystery_id) {
    transitionData = {
      title: mystery.title,
      subtitle: `Manche ${roundNumber}`,
      imageUrl: mystery.image_path || undefined,
    };
  }

  // Check if there's already an accusation for THIS mystery
  const { data: existingRound, error: roundError } = await supabase
    .from('rounds')
    .select('*')
    .eq('session_id', sessionId)
    .eq('mystery_id', mystery.id)
    .maybeSingle();

  let existingAccusation: LoadCharacterSheetResult['existingAccusation'];
  if (!roundError && existingRound) {
    existingAccusation = {
      accusedPlayerId: existingRound.accused_player_id,
      wasCorrect: existingRound.was_correct,
      role: existingRound.was_correct ? 'guilty' : 'innocent',
    };
  }

  return {
    currentPlayer,
    characterSheet,
    otherPlayers,
    existingAccusation,
    transitionData,
    joinCode,
  };
}

export async function loadScoreboard(sessionId: string): Promise<PlayerScore[]> {
  const { data: allPlayers, error } = await supabase
    .from('players')
    .select('id, name, score')
    .eq('session_id', sessionId)
    .eq('status', 'active')
    .order('score', { ascending: false });

  if (error) {
    console.error('Error loading scoreboard:', error);
    return [];
  }

  return allPlayers || [];
}

export async function loadAvailableMysteries(
  sessionId: string,
  currentPlayerId: string
): Promise<{
  mysteries: AvailableMystery[];
  voteCounts: Record<string, number>;
  selectedMystery: string;
  hasVoted: boolean;
}> {
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
    return {
      mysteries: allMysteries,
      voteCounts: {},
      selectedMystery: '',
      hasVoted: false,
    };
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

  // Load current vote counts
  const tallyResponse = await fetch(`/api/sessions/${sessionId}/tally-votes`);
  let voteCounts: Record<string, number> = {};
  let selectedMystery = '';
  let hasVoted = false;

  if (tallyResponse.ok) {
    const { voteCounts: currentVotes, roundNumber } = await tallyResponse.json();
    voteCounts = currentVotes || {};

    // Check if current player has already voted for this round
    if (currentPlayerId && roundNumber) {
      const { data: existingVote } = await supabase
        .from('mystery_votes')
        .select('mystery_id')
        .eq('session_id', sessionId)
        .eq('player_id', currentPlayerId)
        .eq('round_number', roundNumber)
        .maybeSingle();

      if (existingVote?.mystery_id) {
        selectedMystery = existingVote.mystery_id;
        hasVoted = true;
      }
    }
  }

  return {
    mysteries: available,
    voteCounts,
    selectedMystery,
    hasVoted,
  };
}

export async function submitAccusation(
  accusedPlayerId: string
): Promise<{
  wasCorrect: boolean;
  accusedRole: string;
  gameComplete: boolean;
  messages: {
    investigator: string;
    guilty: string;
    innocent: string;
  };
}> {
  const response = await fetch('/api/rounds/submit-accusation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accusedPlayerId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit accusation');
  }

  return data;
}

export async function submitMysteryVote(
  sessionId: string,
  mysteryId: string
): Promise<void> {
  const response = await fetch(`/api/sessions/${sessionId}/vote-mystery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mysteryId }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to vote');
  }
}
