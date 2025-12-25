import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.sessions.update-language');

/**
 * PUT /api/sessions/[sessionId]/update-language
 * Updates the language for a game session
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { language } = await request.json();

    if (!language || typeof language !== 'string' || language.length !== 2) {
      return NextResponse.json(
        { error: 'Valid 2-character language code is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Update session language
    const { error: updateError } = await (supabase
      .from('game_sessions') as any)
      .update({ language: language.toLowerCase() })
      .eq('id', sessionId);

    if (updateError) {
      log('error', 'Failed to update language', { 
        sessionId, 
        language,
        error: updateError.message 
      });
      return NextResponse.json(
        { error: 'Failed to update language' },
        { status: 500 }
      );
    }

    log('info', 'Language updated', { sessionId, language });

    return NextResponse.json({ success: true });
  } catch (error) {
    log('error', 'Unexpected error updating language', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
