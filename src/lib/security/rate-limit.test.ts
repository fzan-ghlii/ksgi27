import { describe, it, expect } from 'vitest';
import {
  getClientIp,
  MemoryRateLimitStore,
  UpstashRestRateLimitStore,
  enforceRateLimit,
  buildRateLimitHeaders,
} from './rate-limit';

describe('getClientIp', () => {
  it('memprioritaskan header Cloudflare / Vercel daripada X-Forwarded-For biasa', () => {
    const req = new Request('https://gibei-unimed.com/api/events/1/register', {
      headers: {
        'cf-connecting-ip': '203.0.113.10',
        'x-vercel-forwarded-for': '198.51.100.2',
        'x-forwarded-for': '127.0.0.1, 10.0.0.1',
      },
    });
    expect(getClientIp(req)).toBe('203.0.113.10');
  });

  it('menormalkan IPv4:port dan menolak header IP berisi karakter injeksi', () => {
    const reqPort = new Request('https://localhost/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.5:54321, 10.0.0.1' },
    });
    expect(getClientIp(reqPort)).toBe('192.168.1.5');

    const reqSpoof = new Request('https://localhost/api/test', {
      headers: { 'cf-connecting-ip': '1.2.3.4/admin?override=1' },
    });
    expect(getClientIp(reqSpoof)).toBe('anonymous');
  });
});

describe('MemoryRateLimitStore & enforceRateLimit', () => {
  it('memblokir request yang melebihi limit dan reset setelah window berakhir', async () => {
    const store = new MemoryRateLimitStore(10);
    const policy = { namespace: 'test', limit: 2, windowMs: 60_000 };

    const r1 = await enforceRateLimit(policy, '203.0.113.5', { store });
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);

    const r2 = await enforceRateLimit(policy, '203.0.113.5', { store });
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);

    const r3 = await enforceRateLimit(policy, '203.0.113.5', { store });
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);

    const headers = buildRateLimitHeaders(r3);
    expect(headers['X-RateLimit-Limit']).toBe('2');
    expect(headers['Retry-After']).toBeDefined();

    // Setelah windowMs lewat, counter mulai baru
    const r4 = await store.consume('gibei:rl:test:203.0.113.5', 2, 60_000, Date.now() + 61_000);
    expect(r4.allowed).toBe(true);
    expect(r4.remaining).toBe(1);
  });
});

describe('UpstashRestRateLimitStore', () => {
  it('memanggil endpoint /pipeline dan memetakan count & ttl menjadi RateLimitResult', async () => {
    const mockFetch: typeof fetch = async (url, init) => {
      expect(String(url)).toBe('https://example.upstash.io/pipeline');
      expect((init?.headers as Record<string, string>)?.Authorization).toBe('Bearer secret-token');
      return new Response(JSON.stringify([{ result: [6, 45000] }]), { status: 200 });
    };

    const store = new UpstashRestRateLimitStore(
      'https://example.upstash.io/',
      'secret-token',
      mockFetch
    );
    const result = await store.consume('gibei:rl:evt-register:1.2.3.4', 5, 60_000);
    expect(result.backend).toBe('upstash');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBe(45);
  });
});

