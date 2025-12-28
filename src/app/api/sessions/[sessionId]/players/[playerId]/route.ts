import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromCookie } from '@/lib/auth';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.kick-player');

/**
 * DELETE /api/sessions/[sessionId]/players/[playerId]
 * Removes a player from a session (kick)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; playerId: string }> }
) {
  try {
    const { sessionId, playerId } = await params;
    
    // Verify the requester has a valid session
    const sessionData = await getSessionFromCookie();
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Prevent self-kick (use quit instead)
    if (sessionData.playerId === playerId) {
      return NextResponse.json(
        { error: 'Cannot kick yourself. Use quit instead.' },
        { status: 400 }
      );
    }

    // Verify requester is in the same session
    if (sessionData.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'You are not in this session' },
        { status: 403 }
      );
    }

    const supabase = await createServiceClient();

    // Verify the target player exists and is in this session
    const { data: targetPlayer, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('session_id', sessionId)
      .single();

    if (playerError || !targetPlayer) {
      return NextResponse.json(
        { error: 'Player not found in this session' },
        { status: 404 }
      );
    }

    // Update player status to 'kicked'
    const { error: updateError } = await (supabase
      .from('players') as any)
      .update({ status: 'kicked' })
      .eq('id', playerId);

    if (updateError) {
      log('error', 'Failed to kick player', { error: updateError.message });
      return NextResponse.json(
        { error: 'Failed to remove player' },
        { status: 500 }
      );
    }

    // Clean up player_ready_states
    await supabase
      .from('player_ready_states')
      .delete()
      .eq('player_id', playerId)
      .eq('session_id', sessionId);

    // Clean up mystery_votes
    await (supabase.from('mystery_votes') as any)
      .delete()
      .eq('player_id', playerId)
      .eq('session_id', sessionId);

    log('info', 'Player kicked from session', {
      kickedPlayerId: playerId,
      kickedBy: sessionData.playerId,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Player removed from session',
    });
  } catch (error) {
    log('error', 'Unexpected error during kick', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
