import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { resolveRoundRoles } from '@/lib/round-roles';
import { selectRoundWords } from '@/lib/word-selection';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.sessions.assigned-role');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await validateSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session.sessionId !== sessionId) {
      return NextResponse.json({ error: 'Session mismatch' }, { status: 403 });
    }

    const mysteryId = request.nextUrl.searchParams.get('mysteryId');
    if (!mysteryId) {
      return NextResponse.json({ error: 'mysteryId is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const roundRoles = await resolveRoundRoles(supabase, sessionId, mysteryId);
    const assignedRole = roundRoles.rolesByPlayerId.get(session.playerId);

    if (!assignedRole) {
      return NextResponse.json({ error: 'No assignment found for player' }, { status: 404 });
    }

    // Words are drawn server-side from the mystery's word pool so the client
    // only ever sees its own role's 3 words, never the full partition.
    let wordsToPlace: string[] = [];
    if (assignedRole !== 'investigator') {
      const { data: mystery, error: mysteryError } = await supabase
        .from('mysteries')
        .select('word_pool')
        .eq('id', mysteryId)
        .single();

      if (mysteryError || !mystery) {
        return NextResponse.json({ error: 'Mystery not found' }, { status: 404 });
      }

      const { guiltyWords, innocentWords } = selectRoundWords(
        sessionId,
        mysteryId,
        mystery.word_pool ?? [],
        process.env.JWT_SECRET || ''
      );
      wordsToPlace = assignedRole === 'guilty' ? guiltyWords : innocentWords;
    }

    return NextResponse.json({ assignedRole, wordsToPlace });
  } catch (error) {
    log('error', 'Failed to resolve assigned role', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
