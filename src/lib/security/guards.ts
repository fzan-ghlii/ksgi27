import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Bandingkan dua string rahasia secara constant-time menggunakan digest SHA-256
 * agar terhindar dari timing side-channel attack maupun perbedaan panjang buffer.
 */
export function timingSafeSecretEqual(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (typeof provided !== 'string' || typeof expected !== 'string') {
    return false;
  }
  if (!provided || !expected.trim()) {
    return false;
  }

  const digestA = createHash('sha256').update(provided, 'utf8').digest();
  const digestB = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(digestA, digestB);
}

/**
 * Validasi magic bytes header binary container WebP ("RIFF" + 4 byte size + "WEBP")
 * untuk menolak file samaran HTML/SVG/script yang menyamar sebagai image/webp.
 */
export function isValidWebpBuffer(buf: Uint8Array | Buffer): boolean {
  if (!buf || buf.length < 12) {
    return false;
  }

  return (
    buf[0] === 0x52 && // R
    buf[1] === 0x49 && // I
    buf[2] === 0x46 && // F
    buf[3] === 0x46 && // F
    buf[8] === 0x57 && // W
    buf[9] === 0x45 && // E
    buf[10] === 0x42 && // B
    buf[11] === 0x50 // P
  );
}

/**
 * Validasi magic bytes header PDF ("%PDF-") untuk menolak file bukan PDF
 * yang mengganti ekstensi menjadi .pdf.
 */
export function isValidPdfBuffer(buf: Uint8Array | Buffer): boolean {
  if (!buf || buf.length < 8) {
    return false;
  }

  return (
    buf[0] === 0x25 && // %
    buf[1] === 0x50 && // P
    buf[2] === 0x44 && // D
    buf[3] === 0x46 && // F
    buf[4] === 0x2d // -
  );
}

const SAFE_DOC_ID_REGEX = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Pastikan ID dokumen Firestore hanya memuat karakter aman tanpa path traversal.
 */
export function isSafeDocId(id: string | null | undefined): id is string {
  return typeof id === 'string' && SAFE_DOC_ID_REGEX.test(id);
}

/**
 * Sanitasi nilai sel CSV agar aman dari quote breakout dan formula injection
 * di Excel/Google Sheets/LibreOffice Calc.
 */
export function sanitizeCsvCell(
  val: string | number | boolean | undefined | null
): string {
  if (val === undefined || val === null) {
    return '""';
  }

  let s = String(val).replace(/"/g, '""');
  if (/^(?:[\t\r\n]| *[=+\-@])/.test(s)) {
    s = `'${s}`;
  }
  return `"${s}"`;
}

export interface MutationOriginInput {
  method: string;
  pathname: string;
  origin?: string | null;
  referer?: string | null;
  host?: string | null;
  forwardedHost?: string | null;
  appUrl?: string | null;
  fetchSite?: string | null;
}

export interface MutationOriginResult {
  allowed: boolean;
  reason: string;
}

const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXEMPT_API_PATHS = new Set(['/api/webhooks/gform']);

function parseUrlHost(raw: string | null | undefined): string | null {
  if (!raw || raw === 'null') return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Verifikasi Origin/Referer pada mutating request ke `/api/*` sebagai pertahanan CSRF
 * lapis kedua di luar `SameSite=Lax` cookie.
 */
export function isAllowedMutationOrigin(
  input: MutationOriginInput
): MutationOriginResult {
  const method = input.method.toUpperCase();
  if (SAFE_HTTP_METHODS.has(method)) {
    return { allowed: true, reason: 'safe-method' };
  }

  if (!input.pathname.startsWith('/api/')) {
    return { allowed: true, reason: 'non-api' };
  }

  if (CSRF_EXEMPT_API_PATHS.has(input.pathname)) {
    return { allowed: true, reason: 'webhook-exempt' };
  }

  const allowedHosts = new Set<string>();
  if (input.host) {
    allowedHosts.add(input.host.trim().toLowerCase());
  }
  if (input.forwardedHost) {
    const firstForwarded = input.forwardedHost.split(',')[0]?.trim().toLowerCase();
    if (firstForwarded) allowedHosts.add(firstForwarded);
  }
  const configuredHost = parseUrlHost(input.appUrl);
  if (configuredHost) {
    allowedHosts.add(configuredHost);
  }

  if (input.origin !== undefined && input.origin !== null && input.origin !== '') {
    const originHost = parseUrlHost(input.origin);
    if (!originHost) {
      return { allowed: false, reason: 'invalid-origin' };
    }
    if (allowedHosts.has(originHost)) {
      return { allowed: true, reason: 'origin-match' };
    }
    return { allowed: false, reason: 'origin-mismatch' };
  }

  if (input.referer) {
    const refererHost = parseUrlHost(input.referer);
    if (!refererHost) {
      return { allowed: false, reason: 'invalid-referer' };
    }
    if (allowedHosts.has(refererHost)) {
      return { allowed: true, reason: 'referer-match' };
    }
    return { allowed: false, reason: 'referer-mismatch' };
  }

  if (input.fetchSite?.toLowerCase() === 'same-origin') {
    return { allowed: true, reason: 'sec-fetch-same-origin' };
  }

  return { allowed: false, reason: 'missing-origin' };
}

