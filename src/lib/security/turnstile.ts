import { randomUUID } from 'node:crypto';

export interface TurnstileVerifyInput {
  token: string | null | undefined;
  remoteIp?: string | null;
  expectedAction: string;
  fetchImpl?: typeof fetch;
  env?: Partial<Record<string, string | undefined>>;
}

export interface TurnstileVerifyResult {
  ok: boolean;
  skipped?: boolean;
  reason: string;
}

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function resolveSecret(env: Partial<Record<string, string | undefined>>): string {
  return (env.TURNSTILE_SECRET_KEY || env.TURNSTILE_SECRET || '').trim();
}

export function getExpectedTurnstileHostnames(
  env: Partial<Record<string, string | undefined>> = process.env
): Set<string> {
  const explicit = (env.TURNSTILE_HOSTNAMES || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const isProd = env.NODE_ENV === 'production';
  const hosts = new Set<string>();

  for (const h of explicit) {
    if (isProd && (h === 'localhost' || h === '127.0.0.1')) continue;
    hosts.add(h);
  }

  if (hosts.size === 0 && env.NEXT_PUBLIC_APP_URL) {
    try {
      const parsed = new URL(env.NEXT_PUBLIC_APP_URL);
      const hostname = parsed.hostname.toLowerCase();
      if (!isProd || (hostname !== 'localhost' && hostname !== '127.0.0.1')) {
        hosts.add(hostname);
      }
    } catch {
      // Abaikan URL app yang tidak valid
    }
  }

  return hosts;
}

/**
 * Verifikasi token Cloudflare Turnstile di sisi server (`siteverify`).
 * - Bila `TURNSTILE_SECRET_KEY` / `TURNSTILE_SECRET` belum diset dan `TURNSTILE_REQUIRED !== 'true'`,
 *   verifikasi dilewati agar development/deployment awal tetap berjalan.
 * - Begitu secret dikonfigurasi (atau `TURNSTILE_REQUIRED=true`), handler selalu fail-closed.
 */
export async function verifyTurnstileToken(
  input: TurnstileVerifyInput
): Promise<TurnstileVerifyResult> {
  const env = input.env ?? process.env;
  const secret = resolveSecret(env);
  const required = env.TURNSTILE_REQUIRED === 'true';

  if (!secret) {
    if (required) {
      return { ok: false, reason: 'turnstile-not-configured' };
    }
    return { ok: true, skipped: true, reason: 'turnstile-disabled' };
  }

  if (
    typeof input.token !== 'string' ||
    input.token.trim().length === 0 ||
    input.token.length > 2048
  ) {
    return { ok: false, reason: 'missing-or-invalid-token' };
  }

  const expectedHostnames = getExpectedTurnstileHostnames(env);
  if (expectedHostnames.size === 0) {
    return { ok: false, reason: 'missing-expected-hostnames' };
  }

  const body = new URLSearchParams({
    secret,
    response: input.token.trim(),
    idempotency_key: randomUUID(),
  });
  if (input.remoteIp && input.remoteIp !== 'anonymous') {
    body.set('remoteip', input.remoteIp);
  }

  const fetchImpl = input.fetchImpl ?? fetch;

  let data: {
    success?: boolean;
    action?: string;
    hostname?: string;
    'error-codes'?: string[];
  };

  try {
    const res = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return { ok: false, reason: `siteverify-http-${res.status}` };
    }

    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, reason: 'siteverify-network-error' };
  }

  if (data.success !== true) {
    return { ok: false, reason: 'siteverify-rejected' };
  }

  if (data.action !== input.expectedAction) {
    return { ok: false, reason: 'action-mismatch' };
  }

  const returnedHost = typeof data.hostname === 'string' ? data.hostname.toLowerCase() : '';
  if (!returnedHost || !expectedHostnames.has(returnedHost)) {
    return { ok: false, reason: 'hostname-mismatch' };
  }

  return { ok: true, reason: 'verified' };
}

