import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

/**
 * GET /api/session/me
 * Returns current player session data
 */
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json(session);
}
