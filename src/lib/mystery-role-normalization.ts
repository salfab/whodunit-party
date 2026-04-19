export type PublicCharacterRole = 'investigator' | 'suspect';
export type DatabaseCharacterRole = 'investigator' | 'guilty' | 'innocent';

export function normalizeCharacterRole(role: unknown): PublicCharacterRole | unknown {
  if (role === 'investigator') return 'investigator';
  if (role === 'suspect' || role === 'guilty' || role === 'innocent') return 'suspect';
  return role;
}

export function normalizeMysteryRoles<T extends { character_sheets?: Array<{ role?: unknown }> }>(
  mystery: T
): T {
  return {
    ...mystery,
    character_sheets: mystery.character_sheets?.map((sheet) => ({
      ...sheet,
      role: normalizeCharacterRole(sheet.role),
    })),
  };
}

export function publicRoleToDatabaseRole(role: PublicCharacterRole): DatabaseCharacterRole {
  return role === 'investigator' ? 'investigator' : 'innocent';
}

export function databaseRoleToPublicRole(role: unknown): PublicCharacterRole | unknown {
  return role === 'investigator' ? 'investigator' : normalizeCharacterRole(role);
}
