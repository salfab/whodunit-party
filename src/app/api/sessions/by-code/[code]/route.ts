import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/sessions/by-code/[code]
 * Look up a session by its join code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: 'Join code is required' }, { status: 400 });
  }

  try {
    const supabase = await createServiceClient();

    // Look up session by join code
    const { data: session, error } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('join_code', code.toUpperCase())
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error looking up session by code:', error);
    return NextResponse.json(
      { error: 'Failed to look up session' },
      { status: 500 }
    );
  }
}
