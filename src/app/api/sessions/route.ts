import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.sessions.create');

/**
 * Generate a unique 6-character join code
 */
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/sessions
 * Creates a new game session with a unique join code
 */
export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      log('error', 'Missing Supabase environment variables', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = await createServiceClient();

    // Generate unique join code
    let joinCode = generateJoinCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure the code is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('join_code', joinCode)
        .single();

      if (!existing) {
        break;
      }

      joinCode = generateJoinCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      log('error', 'Failed to generate unique join code');
      return NextResponse.json(
        { error: 'Failed to generate unique join code' },
        { status: 500 }
      );
    }

    // Create the session
    const { data: sessionData, error } = await (supabase
      .from('game_sessions') as any)
      .insert({
        join_code: joinCode,
        status: 'lobby',
        language: 'fr', // Default language
      })
      .select()
      .single();
    
    const session = sessionData as any;

    if (error) {
      log('error', 'Failed to create session', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    log('info', 'Session created', { sessionId: session.id, joinCode });

    return NextResponse.json({
      sessionId: session.id,
      joinCode: session.join_code,
    });
  } catch (error) {
    log('error', 'Unexpected error creating session', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}