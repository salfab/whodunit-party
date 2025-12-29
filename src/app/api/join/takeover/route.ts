import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createSession, setSessionCookie } from '@/lib/auth';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.takeover');

interface TakeoverRequestBody {
  joinCode: string;
  playerName: string;
}

/**
 * POST /api/join/takeover
 * Takes over an existing player session (for reconnecting)
 */
export async function POST(request: NextRequest) {
  try {
    const body: TakeoverRequestBody = await request.json();
    const { joinCode, playerName } = body;

    if (!joinCode || !playerName) {
      return NextResponse.json(
        { error: 'Join code and player name are required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Find the session by join code
    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    const session = sessionData as any;

    if (sessionError || !session) {
      log('warn', 'Invalid join code for takeover', { joinCode });
      return NextResponse.json(
        { error: 'Invalid join code' },
        { status: 404 }
      );
    }

    // Find existing player with same name (case-insensitive)
    const { data: existingPlayerData, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('session_id', session.id)
      .ilike('name', playerName.trim())
      .single();

    const existingPlayer = existingPlayerData as any;

    if (playerError || !existingPlayer) {
      log('warn', 'Player not found for takeover', { joinCode, playerName });
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Reactivate the player
    // When someone takes over, they inherit the player's points and character
    const { error: updateError } = await (supabase
      .from('players') as any)
      .update({
        status: 'active',
        last_heartbeat: new Date().toISOString(),
      })
      .eq('id', existingPlayer.id);

    if (updateError) {
      log('error', 'Failed to reactivate player', { error: updateError.message });
      return NextResponse.json(
        { error: 'Failed to takeover session' },
        { status: 500 }
      );
    }

    // Create new session token for this player
    const token = await createSession({
      playerId: existingPlayer.id,
      sessionId: session.id,
      playerName: existingPlayer.name,
    });

    // Set cookie
    await setSessionCookie(token);

    log('info', 'Player took over session', {
      playerId: existingPlayer.id,
      sessionId: session.id,
      playerName: existingPlayer.name,
    });

    return NextResponse.json({
      playerId: existingPlayer.id,
      sessionId: session.id,
      playerName: existingPlayer.name,
      takenOver: true,
    });
  } catch (error) {
    log('error', 'Unexpected error during takeover', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
