import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.sessions.distribute-roles');

/**
 * POST /api/sessions/[sessionId]/distribute-roles
 * Distributes character roles to players for a specific mystery
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { mysteryId } = await request.json();

    if (!mysteryId) {
      return NextResponse.json(
        { error: 'Mystery ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get active players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (playersError || !players) {
      log('error', 'Failed to fetch players', { error: playersError?.message });
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    if (players.length < 5) {
      return NextResponse.json(
        { error: 'At least 5 players required' },
        { status: 400 }
      );
    }

    // Get character sheets for the mystery
    const { data: sheets, error: sheetsError } = await supabase
      .from('character_sheets')
      .select('*')
      .eq('mystery_id', mysteryId);

    if (sheetsError || !sheets) {
      log('error', 'Failed to fetch character sheets', { error: sheetsError?.message });
      return NextResponse.json(
        { error: 'Failed to fetch character sheets' },
        { status: 500 }
      );
    }

    // Separate sheets by role
    const investigatorSheet = sheets.find((s) => s.role === 'investigator');
    const guiltySheet = sheets.find((s) => s.role === 'guilty');
    const innocentSheets = sheets.filter((s) => s.role === 'innocent');

    if (!investigatorSheet || !guiltySheet) {
      log('error', 'Mystery missing required roles', { mysteryId });
      return NextResponse.json(
        { error: 'Mystery is missing required roles' },
        { status: 400 }
      );
    }

    // Shuffle players
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Assign investigator and guilty (always distributed)
    const assignments = [
      {
        session_id: sessionId,
        player_id: shuffledPlayers[0].id,
        sheet_id: investigatorSheet.id,
        mystery_id: mysteryId,
      },
      {
        session_id: sessionId,
        player_id: shuffledPlayers[1].id,
        sheet_id: guiltySheet.id,
        mystery_id: mysteryId,
      },
    ];

    // Distribute innocent sheets to remaining players
    const remainingPlayers = shuffledPlayers.slice(2);
    const shuffledInnocentSheets = [...innocentSheets].sort(() => Math.random() - 0.5);

    for (let i = 0; i < remainingPlayers.length && i < shuffledInnocentSheets.length; i++) {
      assignments.push({
        session_id: sessionId,
        player_id: remainingPlayers[i].id,
        sheet_id: shuffledInnocentSheets[i].id,
        mystery_id: mysteryId,
      });
    }

    // Insert assignments
    const { error: assignError } = await supabase
      .from('player_assignments')
      .insert(assignments);

    if (assignError) {
      log('error', 'Failed to create assignments', { error: assignError.message });
      return NextResponse.json(
        { error: 'Failed to distribute roles' },
        { status: 500 }
      );
    }

    // Update session status and current mystery
    const { error: updateError } = await supabase
      .from('game_sessions')
      .update({
        status: 'playing',
        current_mystery_id: mysteryId,
      })
      .eq('id', sessionId);

    if (updateError) {
      log('error', 'Failed to update session', { error: updateError.message });
    }

    log('info', 'Roles distributed', {
      sessionId,
      mysteryId,
      playerCount: players.length,
      assignmentCount: assignments.length,
    });

    return NextResponse.json({
      success: true,
      assignmentCount: assignments.length,
    });
  } catch (error) {
    log('error', 'Unexpected error distributing roles', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
