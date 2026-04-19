import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { resolveRoundRoles } from '@/lib/round-roles';
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

    return NextResponse.json({ assignedRole });
  } catch (error) {
    log('error', 'Failed to resolve assigned role', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
