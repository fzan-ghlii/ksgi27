import { NextResponse } from 'next/server';

export interface RateLimitPolicy {
  namespace: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  backend: 'upstash' | 'memory';
}

export interface RateLimitStore {
  readonly backend: 'upstash' | 'memory';
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

export const RATE_LIMIT_POLICIES = {
  authSession: { namespace: 'auth-session', limit: 10, windowMs: 10 * 60 * 1000 },
  activationValidate: { namespace: 'act-validate', limit: 10, windowMs: 15 * 60 * 1000 },
  activationComplete: { namespace: 'act-complete', limit: 10, windowMs: 15 * 60 * 1000 },
  eventRegister: { namespace: 'evt-register', limit: 5, windowMs: 10 * 60 * 1000 },
  articleView: { namespace: 'art-view', limit: 1, windowMs: 5 * 60 * 1000 },
  imageUpload: { namespace: 'img-upload', limit: 20, windowMs: 10 * 60 * 1000 },
  webhookGform: { namespace: 'wh-gform', limit: 60, windowMs: 60 * 1000 },
} as const satisfies Record<string, RateLimitPolicy>;

const SAFE_IP_CHARS = /^[a-fA-F0-9:.]{2,64}$/;

function normalizeIpCandidate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim();
  if (!first) return null;

  // Strip IPv6 bracket wrapper ([::1]:3000 -> ::1) or IPv4 :port (1.2.3.4:1234 -> 1.2.3.4)
  let cleaned = first;
  if (cleaned.startsWith('[')) {
    const endBracket = cleaned.indexOf(']');
    if (endBracket > 1) {
      cleaned = cleaned.slice(1, endBracket);
    }
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(cleaned)) {
    cleaned = cleaned.split(':')[0]!;
  }

  return SAFE_IP_CHARS.test(cleaned) ? cleaned.toLowerCase() : null;
}

/**
 * Ambil alamat IP klien secara tahan spoof dengan memprioritaskan header
 * edge/platform terpercaya (`CF-Connecting-IP`, `x-vercel-forwarded-for`).
 */
export function getClientIp(req: Request): string {
  const candidates = [
    req.headers.get('cf-connecting-ip'),
    req.headers.get('x-vercel-forwarded-for'),
    req.headers.get('x-real-ip'),
    req.headers.get('x-forwarded-for'),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIpCandidate(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return 'anonymous';
}

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const DEFAULT_MEMORY_MAX_KEYS = 5000;

export class MemoryRateLimitStore implements RateLimitStore {
  readonly backend = 'memory' as const;
  private readonly buckets = new Map<string, MemoryBucket>();
  private readonly maxKeys: number;

  constructor(maxKeys = DEFAULT_MEMORY_MAX_KEYS) {
    this.maxKeys = maxKeys;
  }

  private sweepExpired(now: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  async consume(
    key: string,
    limit: number,
    windowMs: number,
    now = Date.now()
  ): Promise<RateLimitResult> {
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      if (this.buckets.size >= this.maxKeys) {
        this.sweepExpired(now);
      }
      if (this.buckets.size >= this.maxKeys) {
        const oldestKey = this.buckets.keys().next().value;
        if (oldestKey !== undefined) {
          this.buckets.delete(oldestKey);
        }
      }

      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        limit,
        remaining: Math.max(0, limit - 1),
        resetAt,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
        backend: 'memory',
      };
    }

    existing.count += 1;
    const allowed = existing.count <= limit;
    const remaining = Math.max(0, limit - existing.count);
    const retryAfterMs = Math.max(1000, existing.resetAt - now);

    return {
      allowed,
      limit,
      remaining,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      backend: 'memory',
    };
  }

  clear() {
    this.buckets.clear();
  }
}

const LUA_FIXED_WINDOW_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 or redis.call('PTTL', KEYS[1]) < 0 then
  redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[1]))
end
local ttl = redis.call('PTTL', KEYS[1])
return {current, ttl}
`.trim();

export class UpstashRestRateLimitStore implements RateLimitStore {
  readonly backend = 'upstash' as const;
  private readonly restUrl: string;
  private readonly restToken: string;
  private readonly fetchImpl: typeof fetch;

  constructor(
    restUrl: string,
    restToken: string,
    fetchImpl: typeof fetch = fetch
  ) {
    this.restUrl = restUrl.replace(/\/+$/, '');
    this.restToken = restToken;
    this.fetchImpl = fetchImpl;
  }

  async consume(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const res = await this.fetchImpl(`${this.restUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.restToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['EVAL', LUA_FIXED_WINDOW_SCRIPT, '1', key, String(windowMs)],
      ]),
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Upstash REST returned HTTP ${res.status}`);
    }

    const payload = (await res.json()) as Array<{
      result?: [number, number];
      error?: string;
    }>;

    const first = payload?.[0];
    if (!first || first.error || !Array.isArray(first.result)) {
      throw new Error(first?.error || 'Invalid Upstash pipeline response');
    }

    const count = Number(first.result[0] ?? 1);
    const pttl = Math.max(1000, Number(first.result[1] ?? windowMs));
    const now = Date.now();

    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: now + pttl,
      retryAfterSeconds: Math.ceil(pttl / 1000),
      backend: 'upstash',
    };
  }
}

const defaultMemoryStore = new MemoryRateLimitStore();

function sanitizeKeySegment(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._:-]/g, '_').slice(0, 128) || 'anonymous';
}

/**
 * Terapkan pembatasan laju permintaan per policy dan identifier (IP/UID/slug:IP).
 * Menggunakan Upstash Redis REST bila dikonfigurasi, atau fallback ke memory store.
 */
export async function enforceRateLimit(
  policy: RateLimitPolicy,
  identifier: string,
  options?: { store?: RateLimitStore; fallbackStore?: MemoryRateLimitStore }
): Promise<RateLimitResult> {
  const key = `gibei:rl:${policy.namespace}:${sanitizeKeySegment(identifier)}`;
  const fallbackStore = options?.fallbackStore ?? defaultMemoryStore;

  if (options?.store) {
    return options.store.consume(key, policy.limit, policy.windowMs);
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (upstashUrl && upstashToken) {
    try {
      const upstashStore = new UpstashRestRateLimitStore(upstashUrl, upstashToken);
      return await upstashStore.consume(key, policy.limit, policy.windowMs);
    } catch (err) {
      console.warn('[RateLimit] Upstash gagal, fallback ke memory store:', err);
    }
  }

  return fallbackStore.consume(key, policy.limit, policy.windowMs);
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    headers['Retry-After'] = String(result.retryAfterSeconds);
  }

  return headers;
}

export function rateLimitErrorResponse(
  result: RateLimitResult,
  message = 'Terlalu banyak permintaan dari perangkat Anda. Silakan coba lagi beberapa menit lagi.'
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: buildRateLimitHeaders(result),
    }
  );
}

