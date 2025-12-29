import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createSession, setSessionCookie } from '@/lib/auth';
import { createLogger } from '@/lib/logging';
import type { Database } from '@/types/database';

const log = createLogger('api.join');

type Player = Database['public']['Tables']['players']['Row'];

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
    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('join_code', joinCode.toUpperCase())
      .single();
    
    const session = sessionData as any;

    if (sessionError || !session) {
      log('warn', 'Invalid join code', { joinCode });
      return NextResponse.json(
        { error: 'Invalid join code' },
        { status: 404 }
      );
    }

    // Check if a player with this name already exists in the session FIRST
    // This allows takeover even if the game has already started
    const { data: existingPlayer, error: existingPlayerError } = await supabase
      .from('players')
      .select('*')
      .eq('session_id', session.id)
      .ilike('name', playerName.trim())
      .maybeSingle<Player>();

    if (existingPlayer && !existingPlayerError) {
      log('info', 'Name already taken, offering takeover', { 
        joinCode, 
        playerName, 
        existingPlayerId: existingPlayer.id,
        sessionStatus: session.status
      });
      return NextResponse.json(
        {
          error: 'NAME_TAKEN',
          message: 'Ce nom est déjà utilisé dans cette partie',
          existingPlayerId: existingPlayer.id,
          canTakeover: true,
        },
        { status: 409 }
      );
    }

    // Only check session status if the player doesn't already exist
    if (session.status !== 'lobby') {
      log('warn', 'Session not in lobby state', { sessionId: session.id, status: session.status });
      return NextResponse.json(
        { error: 'This game has already started' },
        { status: 400 }
      );
    }

    // Create the player
    const { data: playerData, error: playerError } = await (supabase
      .from('players') as any)
      .insert({
        session_id: session.id,
        name: playerName.trim(),
        status: 'active',
      })
      .select()
      .single();
    
    const player = playerData as any;

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
