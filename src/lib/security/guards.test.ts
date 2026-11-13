import { describe, it, expect } from 'vitest';
import {
  timingSafeSecretEqual,
  isValidWebpBuffer,
  isValidPdfBuffer,
  isSafeDocId,
  sanitizeCsvCell,
  isAllowedMutationOrigin,
} from './guards';

describe('timingSafeSecretEqual', () => {
  it('menerima token identik dan menolak token berbeda/kosong', () => {
    expect(timingSafeSecretEqual('rahasia-super-123', 'rahasia-super-123')).toBe(true);
    expect(timingSafeSecretEqual('rahasia-super-123', 'rahasia-super-124')).toBe(false);
    expect(timingSafeSecretEqual('rahasia-super-123', 'pendek')).toBe(false);
    expect(timingSafeSecretEqual('', '')).toBe(false);
    expect(timingSafeSecretEqual('   ', '   ')).toBe(false);
    expect(timingSafeSecretEqual(null, 'secret')).toBe(false);
    expect(timingSafeSecretEqual('secret', undefined)).toBe(false);
  });
});

describe('isValidWebpBuffer', () => {
  it('menerima buffer dengan header RIFF + WEBP yang valid', () => {
    const webp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // chunk size
      0x57, 0x45, 0x42, 0x50, // WEBP
      0x56, 0x50, 0x38, 0x20, // VP8
    ]);
    expect(isValidWebpBuffer(webp)).toBe(true);
  });

  it('menolak payload HTML, SVG, PHP, PNG, maupun buffer pendek', () => {
    expect(isValidWebpBuffer(Buffer.from('<html><script>alert(1)</script></html>'))).toBe(false);
    expect(isValidWebpBuffer(Buffer.from('<svg onload=alert(1)>'))).toBe(false);
    expect(isValidWebpBuffer(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))).toBe(false);
    expect(isValidWebpBuffer(Buffer.from('RIFF\x00\x00\x00\x00AVI '))).toBe(false);
    expect(isValidWebpBuffer(Buffer.from('RIFF1234WEB'))).toBe(false);
  });
});

describe('isSafeDocId', () => {
  it('menerima ID alfanumerik aman dan menolak path traversal', () => {
    expect(isSafeDocId('img_1794537600_ab12cd')).toBe(true);
    expect(isSafeDocId('doc-001_XYZ')).toBe(true);
    expect(isSafeDocId('../users/admin')).toBe(false);
    expect(isSafeDocId('img/123')).toBe(false);
    expect(isSafeDocId('')).toBe(false);
    expect(isSafeDocId(null)).toBe(false);
    expect(isSafeDocId('a'.repeat(129))).toBe(false);
  });
});

describe('sanitizeCsvCell', () => {
  it('menetralkan formula injection dan escape tanda kutip ganda', () => {
    expect(sanitizeCsvCell('=CMD|"/C calc"!A0')).toBe('"\'=CMD|""/C calc""!A0"');
    expect(sanitizeCsvCell('+1+1')).toBe('"\'+1+1"');
    expect(sanitizeCsvCell('-2+3')).toBe('"\'-2+3"');
    expect(sanitizeCsvCell('@SUM(A1:A2)')).toBe('"\'@SUM(A1:A2)"');
    expect(sanitizeCsvCell(' =1+1')).toBe('"\' =1+1"');
    expect(sanitizeCsvCell('\t=1+1')).toBe('"\'\t=1+1"');
    expect(sanitizeCsvCell('Budi "Trader"')).toBe('"Budi ""Trader"""');
    expect(sanitizeCsvCell('2026-11-13')).toBe('"2026-11-13"');
    expect(sanitizeCsvCell(null)).toBe('""');
  });
});

describe('isAllowedMutationOrigin', () => {
  it('mengizinkan metode aman, rute non-API, webhook exempt, dan same-origin valid', () => {
    expect(
      isAllowedMutationOrigin({
        method: 'GET',
        pathname: '/api/images/img_1',
      }).allowed
    ).toBe(true);

    expect(
      isAllowedMutationOrigin({
        method: 'POST',
        pathname: '/api/webhooks/gform',
      })
    ).toEqual({ allowed: true, reason: 'webhook-exempt' });

    expect(
      isAllowedMutationOrigin({
        method: 'POST',
        pathname: '/api/articles',
        origin: 'https://gibei-unimed.com',
        host: 'gibei-unimed.com',
      })
    ).toEqual({ allowed: true, reason: 'origin-match' });

    expect(
      isAllowedMutationOrigin({
        method: 'DELETE',
        pathname: '/api/auth/session',
        origin: 'https://gibei-unimed.com',
        forwardedHost: 'gibei-unimed.com, internal.proxy',
      })
    ).toEqual({ allowed: true, reason: 'origin-match' });
  });

  it('menolak cross-origin CSRF, origin null, dan request tanpa origin/referer', () => {
    expect(
      isAllowedMutationOrigin({
        method: 'POST',
        pathname: '/api/users',
        origin: 'https://attacker.example',
        host: 'gibei-unimed.com',
      })
    ).toEqual({ allowed: false, reason: 'origin-mismatch' });

    expect(
      isAllowedMutationOrigin({
        method: 'POST',
        pathname: '/api/articles',
        origin: 'null',
        host: 'gibei-unimed.com',
      })
    ).toEqual({ allowed: false, reason: 'invalid-origin' });

    expect(
      isAllowedMutationOrigin({
        method: 'PATCH',
        pathname: '/api/piket/attendances',
        host: 'gibei-unimed.com',
        fetchSite: 'cross-site',
      })
    ).toEqual({ allowed: false, reason: 'missing-origin' });
  });
});

describe('isValidPdfBuffer', () => {
  it('menerima buffer dengan header %PDF- yang valid dan menolak payload palsu', () => {
    expect(isValidPdfBuffer(Buffer.from('%PDF-1.7\n1 0 obj'))).toBe(true);
    expect(isValidPdfBuffer(Buffer.from('<html><script>alert(1)</script></html>'))).toBe(false);
    expect(isValidPdfBuffer(Buffer.from('%PDF'))).toBe(false);
  });
});

