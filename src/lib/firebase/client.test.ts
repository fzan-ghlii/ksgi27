import { describe, it, expect, vi, afterEach } from 'vitest';

describe('firebase client lazy initialization', () => {
  const origApiKey = process.env.FIREBASE_API_KEY;

  afterEach(() => {
    process.env.FIREBASE_API_KEY = origApiKey;
    vi.resetModules();
  });

  it('tidak melempar auth/invalid-api-key saat modul diimpor tanpa FIREBASE_API_KEY (aman untuk SSR prerender)', async () => {
    delete process.env.FIREBASE_API_KEY;
    vi.resetModules();

    const mod = await import('./client');
    await expect(mod.loginWithEmail('test@example.com', 'secret123')).rejects.toThrow(
      'FIREBASE_API_KEY'
    );
  });
});

