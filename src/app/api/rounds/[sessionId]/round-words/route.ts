import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { selectRoundWords } from '@/lib/word-selection';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.rounds.round-words');

/**
 * GET /api/rounds/[sessionId]/round-words?mysteryId=...
 * Returns the 6 words drawn for the round, for the end-of-mystery feedback
 * form. Like the guilty-player reveal, this is gated on the rounds row: until
 * an accusation has been made, each player only knows their own 3 words.
 */
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

    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select('id')
      .eq('session_id', sessionId)
      .eq('mystery_id', mysteryId)
      .maybeSingle();

    if (roundError) {
      log('error', 'Failed to verify accusation', { error: roundError });
      return NextResponse.json({ error: 'Failed to verify accusation' }, { status: 500 });
    }

    if (!round) {
      return NextResponse.json({ error: 'No accusation found for this mystery' }, { status: 404 });
    }

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

    // Flat and sorted: the feedback form shows the words without revealing
    // which side each word was on, to avoid biasing the ratings.
    const allWords = [...guiltyWords, ...innocentWords].sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ allWords });
  } catch (error) {
    log('error', 'Failed to load round words', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
