import { createHmac } from 'crypto';

export type AssignedRole = 'investigator' | 'guilty' | 'innocent';

interface AssignmentForRoleResolution {
  player_id: string;
  character_sheets?: {
    role?: string | null;
  } | null;
}

export interface ResolvedRoundRoles {
  rolesByPlayerId: Map<string, AssignedRole>;
  investigatorPlayerId: string;
  guiltyPlayerId: string;
}

export function pickDeterministicGuiltyPlayerId(
  sessionId: string,
  mysteryId: string,
  suspectPlayerIds: string[],
  secret: string
): string {
  const sortedSuspectPlayerIds = [...suspectPlayerIds].sort();
  const hmacInput = [
    sessionId,
    mysteryId,
    sortedSuspectPlayerIds.join(','),
    'v1',
  ].join(':');

  /*
   * Do not use Math.random() here: the culprit must remain identical when
   * players reload, when the investigator submits an accusation, when the
   * reveal endpoint runs, and even after a server restart. A server-secret HMAC
   * gives us stable randomness for this round without adding a database column,
   * while keeping clients from recalculating the culprit themselves.
   */
  const digest = createHmac('sha256', secret).update(hmacInput).digest('hex');
  const index = Number(BigInt(`0x${digest}`) % BigInt(sortedSuspectPlayerIds.length));

  return sortedSuspectPlayerIds[index];
}

export function resolveRoundRolesFromAssignments(
  assignments: AssignmentForRoleResolution[],
  sessionId: string,
  mysteryId: string,
  secret: string
): ResolvedRoundRoles {
  if (!secret) {
    throw new Error('JWT_SECRET is required to resolve round roles');
  }

  const investigatorAssignments = assignments.filter(
    (assignment) => assignment.character_sheets?.role === 'investigator'
  );

  if (investigatorAssignments.length !== 1) {
    throw new Error(`Expected exactly one investigator assignment, found ${investigatorAssignments.length}`);
  }

  const investigatorPlayerId = investigatorAssignments[0].player_id;
  const suspectPlayerIds = assignments
    .filter((assignment) => assignment.player_id !== investigatorPlayerId)
    .map((assignment) => assignment.player_id);

  if (suspectPlayerIds.length === 0) {
    throw new Error('Expected at least one suspect assignment');
  }

  const guiltyPlayerId = pickDeterministicGuiltyPlayerId(
    sessionId,
    mysteryId,
    suspectPlayerIds,
    secret
  );

  const rolesByPlayerId = new Map<string, AssignedRole>();
  rolesByPlayerId.set(investigatorPlayerId, 'investigator');

  for (const suspectPlayerId of suspectPlayerIds) {
    rolesByPlayerId.set(
      suspectPlayerId,
      suspectPlayerId === guiltyPlayerId ? 'guilty' : 'innocent'
    );
  }

  return {
    rolesByPlayerId,
    investigatorPlayerId,
    guiltyPlayerId,
  };
}

export async function resolveRoundRoles(
  supabase: any,
  sessionId: string,
  mysteryId: string
): Promise<ResolvedRoundRoles> {
  const { data, error } = await supabase
    .from('player_assignments')
    .select(`
      player_id,
      character_sheets (
        role
      )
    `)
    .eq('session_id', sessionId)
    .eq('mystery_id', mysteryId);

  if (error) {
    throw new Error(`Failed to fetch player assignments: ${error.message}`);
  }

  return resolveRoundRolesFromAssignments(
    data || [],
    sessionId,
    mysteryId,
    process.env.JWT_SECRET || ''
  );
}
