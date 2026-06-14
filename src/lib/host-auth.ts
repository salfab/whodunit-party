import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { validateSession } from '@/lib/auth';

/**
 * Ensures the authenticated caller is the host of the given game session.
 *
 * The host is the earliest-joined active player — i.e. the room creator, who
 * is the first to join after the session is created. If the creator leaves,
 * the role transfers to the next-oldest active player. This mirrors the
 * client-side host computation in the lobby exactly (order by created_at, then
 * id, ascending), so UI gating and server enforcement stay consistent.
 *
 * Returns a NextResponse to short-circuit the route on failure (401/403/500),
 * or null when the caller is authorized.
 */
export async function requireHost(sessionId: string): Promise<NextResponse | null> {
  const session = await validateSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated for this session' },
      { status: 401 }
    );
  }

  const supabase = await createServiceClient();
  const { data: host, error } = await supabase
    .from('players')
    .select('id')
    .eq('session_id', sessionId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to verify host' }, { status: 500 });
  }

  if (!host || host.id !== session.playerId) {
    return NextResponse.json(
      { error: 'Only the host can change room settings' },
      { status: 403 }
    );
  }

  return null;
}
