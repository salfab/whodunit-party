import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { ADMIN_SECRET_HEADER } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { GET as listMysteries, POST as createMystery } from './route';
import { DELETE as deleteMystery, GET as getMystery, PUT as updateMystery } from './[id]/route';
import { POST as bulkCreateMysteries } from './bulk-create/route';
import { POST as uploadMysteryPack } from './upload-pack/route';

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(async () => {
    throw new Error('createServiceClient must not be reached without a valid admin secret');
  }),
}));

const SECRET = 'test-admin-secret';

function buildRequest(options: { method?: string; secret?: string } = {}): NextRequest {
  const headers = options.secret ? { [ADMIN_SECRET_HEADER]: options.secret } : undefined;
  return new Request('http://localhost/api/mysteries', {
    method: options.method ?? 'POST',
    headers,
  }) as unknown as NextRequest;
}

const routeParams = { params: Promise.resolve({ id: 'mystery-1' }) };

beforeEach(() => {
  vi.stubEnv('ADMIN_API_SECRET', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('admin protection of mystery management routes', () => {
  it('POST /api/mysteries rejects requests without the admin secret', async () => {
    const response = await createMystery(buildRequest());
    expect(response.status).toBe(401);
  });

  it('GET /api/mysteries/[id] rejects requests without the admin secret', async () => {
    const response = await getMystery(buildRequest({ method: 'GET' }), routeParams);
    expect(response.status).toBe(401);
  });

  it('PUT /api/mysteries/[id] rejects requests without the admin secret', async () => {
    const response = await updateMystery(buildRequest({ method: 'PUT' }), routeParams);
    expect(response.status).toBe(401);
  });

  it('DELETE /api/mysteries/[id] rejects requests without the admin secret', async () => {
    const response = await deleteMystery(buildRequest({ method: 'DELETE' }), routeParams);
    expect(response.status).toBe(401);
  });

  it('POST /api/mysteries/bulk-create rejects requests without the admin secret', async () => {
    const response = await bulkCreateMysteries(buildRequest());
    expect(response.status).toBe(401);
  });

  it('POST /api/mysteries/upload-pack rejects requests without the admin secret', async () => {
    const response = await uploadMysteryPack(buildRequest());
    expect(response.status).toBe(401);
  });

  it('rejects a wrong admin secret', async () => {
    const response = await deleteMystery(
      buildRequest({ method: 'DELETE', secret: 'wrong-secret' }),
      routeParams
    );
    expect(response.status).toBe(401);
  });

  it('lets a correct admin secret through to the handler logic', async () => {
    const response = await deleteMystery(
      buildRequest({ method: 'DELETE', secret: SECRET }),
      routeParams
    );
    // The mocked Supabase client throws, so anything but 401/503 proves
    // the request cleared the auth gate.
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(503);
    expect(createServiceClient).toHaveBeenCalled();
  });

  it('GET /api/mysteries (public list used by the game) stays open', async () => {
    vi.mocked(createServiceClient).mockResolvedValueOnce({
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    } as never);

    const response = await listMysteries(buildRequest({ method: 'GET' }));
    expect(response.status).toBe(200);
  });
});
