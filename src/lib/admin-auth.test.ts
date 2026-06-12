import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_SECRET_HEADER, requireAdminSecret } from './admin-auth';

const SECRET = 'correct-horse-battery-staple';

function buildRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/mysteries', { method: 'POST', headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('requireAdminSecret', () => {
  it('rejects with 503 when ADMIN_API_SECRET is not configured', () => {
    vi.stubEnv('ADMIN_API_SECRET', undefined);

    const response = requireAdminSecret(buildRequest({ [ADMIN_SECRET_HEADER]: 'anything' }));

    expect(response?.status).toBe(503);
  });

  it('rejects with 503 when ADMIN_API_SECRET is blank', () => {
    vi.stubEnv('ADMIN_API_SECRET', '   ');

    const response = requireAdminSecret(buildRequest({ [ADMIN_SECRET_HEADER]: 'anything' }));

    expect(response?.status).toBe(503);
  });

  it('rejects with 401 when the secret header is missing', async () => {
    vi.stubEnv('ADMIN_API_SECRET', SECRET);

    const response = requireAdminSecret(buildRequest());

    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('rejects with 401 when the secret header is wrong', () => {
    vi.stubEnv('ADMIN_API_SECRET', SECRET);

    const response = requireAdminSecret(buildRequest({ [ADMIN_SECRET_HEADER]: 'wrong-secret' }));

    expect(response?.status).toBe(401);
  });

  it('allows the request when the secret header matches', () => {
    vi.stubEnv('ADMIN_API_SECRET', SECRET);

    const response = requireAdminSecret(buildRequest({ [ADMIN_SECRET_HEADER]: SECRET }));

    expect(response).toBeNull();
  });

  it('tolerates surrounding whitespace in the configured secret (CI secrets often gain a trailing newline)', () => {
    vi.stubEnv('ADMIN_API_SECRET', `${SECRET}\n`);

    const response = requireAdminSecret(buildRequest({ [ADMIN_SECRET_HEADER]: SECRET }));

    expect(response).toBeNull();
  });
});
