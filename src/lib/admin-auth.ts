import { createHash, timingSafeEqual } from 'crypto';
import { ADMIN_SECRET_HEADER } from './admin-client';

export { ADMIN_SECRET_HEADER };

function secretsMatch(provided: string, expected: string): boolean {
  // Hash both sides so the buffers have equal length, as timingSafeEqual requires.
  const providedDigest = createHash('sha256').update(provided).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}

/**
 * Guards the admin-only mystery management endpoints.
 *
 * Returns an error response to send back (503 when the server has no
 * ADMIN_API_SECRET configured, 401 when the caller's secret is missing or
 * wrong), or null when the request is authorized. Fail-closed: without a
 * configured secret every request is rejected.
 */
export function requireAdminSecret(request: Request): Response | null {
  const configured = process.env.ADMIN_API_SECRET?.trim();
  if (!configured) {
    return Response.json(
      { error: 'Admin API is not configured (ADMIN_API_SECRET is missing)' },
      { status: 503 }
    );
  }

  const provided = request.headers.get(ADMIN_SECRET_HEADER);
  if (!provided || !secretsMatch(provided, configured)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
