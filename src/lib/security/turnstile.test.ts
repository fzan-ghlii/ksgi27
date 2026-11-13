import { describe, it, expect } from 'vitest';
import {
  getExpectedTurnstileHostnames,
  verifyTurnstileToken,
} from './turnstile';

describe('getExpectedTurnstileHostnames', () => {
  it('menghapus localhost/127.0.0.1 pada NODE_ENV=production dan memakai fallback NEXT_PUBLIC_APP_URL', () => {
    const hosts = getExpectedTurnstileHostnames({
      NODE_ENV: 'production',
      TURNSTILE_HOSTNAMES: 'localhost, gibei-unimed.com, 127.0.0.1',
    });
    expect(hosts.has('gibei-unimed.com')).toBe(true);
    expect(hosts.has('localhost')).toBe(false);
    expect(hosts.has('127.0.0.1')).toBe(false);

    const derived = getExpectedTurnstileHostnames({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://portal.gibei-unimed.id/kegiatan',
    });
    expect(derived.has('portal.gibei-unimed.id')).toBe(true);
  });
});

describe('verifyTurnstileToken', () => {
  it('melewati verifikasi bila secret belum dikonfigurasi dan tidak diwajibkan', async () => {
    const res = await verifyTurnstileToken({
      token: undefined,
      expectedAction: 'event_register',
      env: {},
    });
    expect(res).toEqual({ ok: true, skipped: true, reason: 'turnstile-disabled' });
  });

  it('gagal tertutup (fail-closed) saat TURNSTILE_REQUIRED=true tanpa secret atau token kosong', async () => {
    const noSecret = await verifyTurnstileToken({
      token: 'abc',
      expectedAction: 'event_register',
      env: { TURNSTILE_REQUIRED: 'true' },
    });
    expect(noSecret.ok).toBe(false);

    const missingToken = await verifyTurnstileToken({
      token: '',
      expectedAction: 'event_register',
      env: { TURNSTILE_SECRET_KEY: 'secret-1', TURNSTILE_HOSTNAMES: 'gibei.id' },
    });
    expect(missingToken).toEqual({ ok: false, reason: 'missing-or-invalid-token' });
  });

  it('menerima token valid dengan action & hostname cocok dan menolak action/hostname berbeda', async () => {
    const validFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          success: true,
          action: 'event_register',
          hostname: 'gibei-unimed.com',
        }),
        { status: 200 }
      );

    const okRes = await verifyTurnstileToken({
      token: 'valid-token-xyz',
      remoteIp: '203.0.113.10',
      expectedAction: 'event_register',
      fetchImpl: validFetch,
      env: {
        NODE_ENV: 'production',
        TURNSTILE_SECRET_KEY: 'secret-key',
        TURNSTILE_HOSTNAMES: 'gibei-unimed.com',
      },
    });
    expect(okRes).toEqual({ ok: true, reason: 'verified' });

    const wrongAction = await verifyTurnstileToken({
      token: 'valid-token-xyz',
      expectedAction: 'login',
      fetchImpl: validFetch,
      env: {
        NODE_ENV: 'production',
        TURNSTILE_SECRET_KEY: 'secret-key',
        TURNSTILE_HOSTNAMES: 'gibei-unimed.com',
      },
    });
    expect(wrongAction).toEqual({ ok: false, reason: 'action-mismatch' });

    const wrongHost = await verifyTurnstileToken({
      token: 'valid-token-xyz',
      expectedAction: 'event_register',
      fetchImpl: validFetch,
      env: {
        NODE_ENV: 'production',
        TURNSTILE_SECRET_KEY: 'secret-key',
        TURNSTILE_HOSTNAMES: 'other-domain.com',
      },
    });
    expect(wrongHost).toEqual({ ok: false, reason: 'hostname-mismatch' });

    const networkErr = await verifyTurnstileToken({
      token: 'valid-token-xyz',
      expectedAction: 'event_register',
      fetchImpl: async () => {
        throw new Error('ECONNRESET');
      },
      env: {
        NODE_ENV: 'production',
        TURNSTILE_SECRET_KEY: 'secret-key',
        TURNSTILE_HOSTNAMES: 'gibei-unimed.com',
      },
    });
    expect(networkErr).toEqual({ ok: false, reason: 'siteverify-network-error' });
  });
});

