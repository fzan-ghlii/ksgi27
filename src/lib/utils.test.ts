import { describe, expect, it, vi } from 'vitest';
import { formatDate, withTimeout } from './utils';

describe('withTimeout', () => {
  it('resolves when the promise finishes before the deadline', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 100)).resolves.toBe('ok');
  });

  it('propagates promise rejection rather than timing out', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 100)).rejects.toThrow('boom');
  });

  it('rejects with the custom message when exceeded', async () => {
    vi.useFakeTimers();
    try {
      const never = new Promise<string>(() => {});
      const pending = withTimeout(never, 50, 'FIRESTORE_TIMEOUT');
      const assertion = expect(pending).rejects.toThrow('FIRESTORE_TIMEOUT');
      await vi.advanceTimersByTimeAsync(60);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('formatDate', () => {
  it('returns hyphen for empty values', () => {
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate(null)).toBe('-');
  });
});

