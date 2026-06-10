import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { selectRoundWords } from '@/lib/word-selection';
import { validateFeedbackPayload } from '@/lib/feedback-validation';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.rounds.feedback');

/**
 * POST /api/rounds/[sessionId]/feedback
 * Stores a player's end-of-mystery feedback: optional 1-5 rating, optional
 * comment, and optional per-word flags. One feedback per player per mystery;
 * resubmitting replaces the previous one (idempotent upsert).
 */
export async function POST(
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

    const body = await request.json();
    const mysteryId = body?.mysteryId;
    if (!mysteryId || typeof mysteryId !== 'string') {
      return NextResponse.json({ error: 'mysteryId is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Feedback only opens once the round is over (same gate as the reveal).
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

    const validation = validateFeedbackPayload(body, [...guiltyWords, ...innocentWords]);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { rating, comment, flags } = validation.feedback;

    // player_id comes from the session JWT, never from the body.
    const { data: feedbackRow, error: upsertError } = await (supabase
      .from('mystery_feedback') as any)
      .upsert(
        {
          session_id: sessionId,
          mystery_id: mysteryId,
          player_id: session.playerId,
          rating,
          comment,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,mystery_id,player_id' }
      )
      .select('id')
      .single();

    if (upsertError || !feedbackRow) {
      log('error', 'Failed to upsert feedback', { error: upsertError });
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    // Resubmission replaces the previous flags.
    const { error: deleteError } = await supabase
      .from('mystery_feedback_word_flags')
      .delete()
      .eq('feedback_id', feedbackRow.id);

    if (deleteError) {
      log('error', 'Failed to clear previous word flags', { error: deleteError });
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    if (flags.length > 0) {
      const { error: flagsError } = await (supabase
        .from('mystery_feedback_word_flags') as any)
        .insert(
          flags.map((flag) => ({
            feedback_id: feedbackRow.id,
            mystery_id: mysteryId,
            word: flag.word,
            reason: flag.reason,
            reason_text: flag.reasonText,
          }))
        );

      if (flagsError) {
        log('error', 'Failed to insert word flags', { error: flagsError });
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
      }
    }

    log('info', 'Feedback saved', {
      sessionId,
      mysteryId,
      playerId: session.playerId,
      rating,
      flagCount: flags.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log('error', 'Failed to save feedback', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
