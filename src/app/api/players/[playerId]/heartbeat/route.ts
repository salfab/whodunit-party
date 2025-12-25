import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { validateSession } from '@/lib/auth';

/**
 * POST /api/players/[playerId]/heartbeat
 * Updates the player's last_heartbeat timestamp
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const session = await validateSession();

    // Verify the session matches the player ID
    if (!session || session.playerId !== playerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Update last_heartbeat timestamp
    const { error } = await (supabase
      .from('players') as any)
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', playerId);

    if (error) {
      console.error('Failed to update heartbeat:', error);
      return NextResponse.json(
        { error: 'Failed to update heartbeat' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in heartbeat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
