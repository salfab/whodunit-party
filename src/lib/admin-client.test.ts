import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_SECRET_HEADER,
  ADMIN_SECRET_STORAGE_KEY,
  adminAuthErrorMessage,
  adminFetch,
  getStoredAdminSecret,
  storeAdminSecret,
} from './admin-client';

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
  };
}

const fetchSpy = vi.fn<typeof fetch>(async () => new Response('{}'));

function sentHeaders(): Headers {
  const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
  return new Headers(init?.headers);
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchSpy.mockClear();
});

describe('admin secret storage', () => {
  it('returns null when no secret is stored', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    expect(getStoredAdminSecret()).toBeNull();
  });

  it('stores and retrieves the secret', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    storeAdminSecret('my-secret');
    expect(getStoredAdminSecret()).toBe('my-secret');
  });

  it('clears the stored secret when given a blank value', () => {
    vi.stubGlobal('localStorage', fakeStorage({ [ADMIN_SECRET_STORAGE_KEY]: 'old' }));
    storeAdminSecret('   ');
    expect(getStoredAdminSecret()).toBeNull();
  });
});

describe('adminAuthErrorMessage', () => {
  it('explains a 401 by pointing at the key icon', () => {
    expect(adminAuthErrorMessage(401)).toMatch(/secret admin/i);
  });

  it('explains a 503 as missing server configuration', () => {
    expect(adminAuthErrorMessage(503)).toMatch(/ADMIN_API_SECRET/);
  });

  it('returns null for non-auth statuses', () => {
    expect(adminAuthErrorMessage(500)).toBeNull();
    expect(adminAuthErrorMessage(200)).toBeNull();
  });
});

describe('adminFetch', () => {
  it('sends the admin secret header when a secret is stored', async () => {
    vi.stubGlobal('localStorage', fakeStorage({ [ADMIN_SECRET_STORAGE_KEY]: 'my-secret' }));

    await adminFetch('/api/mysteries/123', { method: 'DELETE' });

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(sentHeaders().get(ADMIN_SECRET_HEADER)).toBe('my-secret');
  });

  it('sends no admin secret header when no secret is stored', async () => {
    vi.stubGlobal('localStorage', fakeStorage());

    await adminFetch('/api/mysteries/123', { method: 'DELETE' });

    expect(sentHeaders().has(ADMIN_SECRET_HEADER)).toBe(false);
  });

  it('preserves headers provided by the caller', async () => {
    vi.stubGlobal('localStorage', fakeStorage({ [ADMIN_SECRET_STORAGE_KEY]: 'my-secret' }));

    await adminFetch('/api/mysteries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const headers = sentHeaders();
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get(ADMIN_SECRET_HEADER)).toBe('my-secret');
  });
});
