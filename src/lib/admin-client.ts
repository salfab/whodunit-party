/**
 * Browser-side helpers for calling the admin-only mystery management API.
 *
 * The admin secret is typed in once (key icon in the admin nav bar), kept in
 * localStorage, and sent as a header on every admin API call. The server
 * checks it against ADMIN_API_SECRET (see admin-auth.ts).
 *
 * This module must stay free of Node-only imports: it is bundled client-side.
 */

export const ADMIN_SECRET_HEADER = 'x-admin-secret';
export const ADMIN_SECRET_STORAGE_KEY = 'whodunit-admin-secret';

export function getStoredAdminSecret(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(ADMIN_SECRET_STORAGE_KEY);
  return value && value.trim() ? value : null;
}

export function storeAdminSecret(secret: string): void {
  if (typeof localStorage === 'undefined') return;
  const trimmed = secret.trim();
  if (trimmed) {
    localStorage.setItem(ADMIN_SECRET_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
  }
}

/**
 * User-facing French message for an admin auth failure, or null when the
 * status is not an auth problem.
 */
export function adminAuthErrorMessage(status: number): string | null {
  if (status === 401) {
    return "Secret admin manquant ou invalide — cliquez sur l'icône clé dans la barre du haut pour le saisir.";
  }
  if (status === 503) {
    return "Le serveur n'a pas de secret admin configuré (ADMIN_API_SECRET).";
  }
  return null;
}

/**
 * fetch() wrapper that attaches the stored admin secret header (when set).
 */
export function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const secret = getStoredAdminSecret();
  if (secret) {
    headers.set(ADMIN_SECRET_HEADER, secret);
  }
  return fetch(input, { ...init, headers });
}
