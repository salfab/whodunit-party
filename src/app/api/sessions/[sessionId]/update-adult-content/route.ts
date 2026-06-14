import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';
import { requireHost } from '@/lib/host-auth';

const log = createLogger('api.sessions.update-adult-content');

/**
 * PUT /api/sessions/[sessionId]/update-adult-content
 * Updates whether this room includes adult / NSFW mysteries in the vote.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const authError = await requireHost(sessionId);
    if (authError) return authError;

    const { includeAdultContent } = await request.json();

    if (typeof includeAdultContent !== 'boolean') {
      return NextResponse.json(
        { error: 'includeAdultContent must be a boolean' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const { error: updateError } = await (supabase
      .from('game_sessions') as any)
      .update({ include_adult_content: includeAdultContent })
      .eq('id', sessionId);

    if (updateError) {
      log('error', 'Failed to update include_adult_content', {
        sessionId,
        includeAdultContent,
        error: updateError.message,
      });
      return NextResponse.json(
        { error: 'Failed to update adult content preference' },
        { status: 500 }
      );
    }

    log('info', 'Adult content preference updated', { sessionId, includeAdultContent });

    return NextResponse.json({ success: true });
  } catch (error) {
    log('error', 'Unexpected error updating adult content preference', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
