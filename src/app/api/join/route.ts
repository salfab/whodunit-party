import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createSession, setSessionCookie } from '@/lib/auth';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.join');

interface JoinRequestBody {
  joinCode: string;
  playerName: string;
}

/**
 * POST /api/join
 * Allows a player to join a game session
 */
export async function POST(request: NextRequest) {
  try {
    const body: JoinRequestBody = await request.json();
    const { joinCode, playerName } = body;

    if (!joinCode || !playerName) {
      return NextResponse.json(
        { error: 'Join code and player name are required' },
        { status: 400 }
      );
    }

    if (playerName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Player name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Find the session by join code
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('id, status')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    if (sessionError || !session) {
      log('warn', 'Invalid join code', { joinCode });
      return NextResponse.json(
        { error: 'Invalid join code' },
        { status: 404 }
      );
    }

    if (session.status !== 'lobby') {
      log('warn', 'Session not in lobby state', { sessionId: session.id, status: session.status });
      return NextResponse.json(
        { error: 'This game has already started' },
        { status: 400 }
      );
    }

    // Create the player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        session_id: session.id,
        name: playerName.trim(),
        status: 'active',
      })
      .select()
      .single();

    if (playerError) {
      log('error', 'Failed to create player', { error: playerError.message });
      return NextResponse.json(
        { error: 'Failed to join session' },
        { status: 500 }
      );
    }

    // Create session token
    const token = await createSession({
      playerId: player.id,
      sessionId: session.id,
      playerName: player.name,
    });

    // Set cookie
    await setSessionCookie(token);

    log('info', 'Player joined session', {
      playerId: player.id,
      sessionId: session.id,
      playerName: player.name,
    });

    return NextResponse.json({
      playerId: player.id,
      sessionId: session.id,
      playerName: player.name,
    });
  } catch (error) {
    log('error', 'Unexpected error during join', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
