import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { resolveRoundRoles } from '@/lib/round-roles';
import { validateSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params; // Await params (Next.js 15 change)
  const searchParams = request.nextUrl.searchParams;
  const mysteryId = searchParams.get('mysteryId');

  console.log('[GUILTY API] Request params:', { sessionId, mysteryId });

  if (!mysteryId) {
    return NextResponse.json(
      { error: 'mysteryId is required' },
      { status: 400 }
    );
  }

  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: 'Invalid or missing session' }, { status: 401 });
  }

  if (session.sessionId !== sessionId) {
    return NextResponse.json({ error: 'Forbidden for this session' }, { status: 403 });
  }

  const supabase = await createServiceClient();

  // First, verify that an accusation exists for this session and mystery
  console.log('[GUILTY API] Querying rounds table...');
  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .select('*')
    .eq('session_id', sessionId)
    .eq('mystery_id', mysteryId)
    .maybeSingle();

  console.log('[GUILTY API] Rounds query result:', {
    hasData: !!round,
    hasError: !!roundError,
    errorDetails: roundError ? JSON.stringify(roundError) : null,
    data: round ? JSON.stringify(round) : null
  });

  if (roundError) {
    console.error('[GUILTY API] Error checking for accusation:', roundError);
    return NextResponse.json(
      { error: 'Failed to verify accusation', details: roundError.message },
      { status: 500 }
    );
  }

  // If no accusation exists, don't reveal the guilty player
  if (!round) {
    console.log('[GUILTY API] No round found for this session/mystery');
    return NextResponse.json(
      { error: 'No accusation found for this mystery' },
      { status: 404 }
    );
  }

  console.log('[GUILTY API] Accusation verified, fetching guilty player...');
  const roundRoles = await resolveRoundRoles(supabase, sessionId, mysteryId);

  // Accusation exists, now fetch the guilty player information
  const { data: guiltyAssignmentData, error: assignmentError } = await supabase
    .from('player_assignments')
    .select(`
      player_id,
      character_sheets (
        character_name,
        occupation,
        image_path,
        dark_secret
      ),
      players (
        name
      )
    `)
    .eq('session_id', sessionId)
    .eq('mystery_id', mysteryId)
    .order('player_id', { ascending: true });

  if (assignmentError) {
    console.error('Error fetching guilty player:', assignmentError);
    return NextResponse.json(
      { error: 'Failed to fetch guilty player information' },
      { status: 500 }
    );
  }

  const guiltyPlayerAssignment = guiltyAssignmentData?.find(
    (a: any) => a.player_id === roundRoles.guiltyPlayerId
  );

  console.log('[GUILTY API] Found guilty player:', guiltyPlayerAssignment ? 'YES' : 'NO');

  if (!guiltyPlayerAssignment) {
    return NextResponse.json(
      { error: 'Guilty player not found' },
      { status: 404 }
    );
  }

  // Calculate player index for consistent placeholders
  const guiltyPlayerIndex = guiltyAssignmentData?.findIndex(
    (a: any) => a.player_id === roundRoles.guiltyPlayerId
  ) ?? 0;

  // Return the guilty player information.
  // The dark secret is only sent to the guilty player themselves: they read
  // it aloud to the table, so other screens must not spoil it.
  const guiltyPlayer = {
    id: guiltyPlayerAssignment.player_id,
    name: guiltyPlayerAssignment.players?.name,
    characterName: guiltyPlayerAssignment.character_sheets?.character_name,
    occupation: guiltyPlayerAssignment.character_sheets?.occupation,
    imagePath: guiltyPlayerAssignment.character_sheets?.image_path,
    darkSecret:
      session.playerId === roundRoles.guiltyPlayerId
        ? guiltyPlayerAssignment.character_sheets?.dark_secret
        : undefined,
    playerIndex: guiltyPlayerIndex,
  };

  console.log('[GUILTY API] Returning guilty player:', guiltyPlayer);
  return NextResponse.json({ guiltyPlayer });
}
