import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BoardMember, Division, UserProfile } from '@/types';

const state = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  updates: [] as Array<{ path: string; patch: Record<string, unknown> }>,
  sets: [] as Array<{ path: string; data: unknown }>,
  invalidated: [] as string[],
  revalidated: [] as string[][],
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/public', () => ({
  invalidatePublicCache: (k: string) => state.invalidated.push(k),
  revalidatePublicPaths: (paths: string[]) => state.revalidated.push(paths),
}));
vi.mock('@/lib/data/audit', () => ({
  buildAudit: (_actor: unknown, payload: Record<string, unknown>) => ({
    ref: { path: 'audit_logs/a1' },
    data: payload,
  }),
}));
vi.mock('@/lib/firebase/admin', () => {
  const docRef = (path: string) => ({ path, id: path.split('/').pop()! });

  const makeQuery = (col: string, filters: Array<[string, unknown]>) => ({
    where(field: string, _op: string, value: unknown) {
      return makeQuery(col, [...filters, [field, value]]);
    },
    limit() {
      return this;
    },
    async _exec() {
      const matched: Array<{ id: string; ref: { path: string; id: string }; data: () => Record<string, unknown> }> = [];
      for (const [path, data] of state.docs.entries()) {
        if (!path.startsWith(`${col}/`)) continue;
        if (filters.every(([f, v]) => data[f] === v)) {
          const ref = docRef(path);
          matched.push({ id: ref.id, ref, data: () => data });
        }
      }
      return { empty: matched.length === 0, docs: matched };
    },
  });

  const adminDb = {
    collection: (col: string) => ({
      doc: (id?: string) => docRef(`${col}/${id ?? 'auto'}`),
      where: (field: string, op: string, value: unknown) => makeQuery(col, [[field, value]]),
    }),
    async runTransaction(fn: (tx: unknown) => Promise<void>) {
      const tx = {
        async get(target: { path?: string; _exec?: () => Promise<unknown> }) {
          if (target._exec) return target._exec();
          const data = state.docs.get(target.path!);
          return {
            exists: data !== undefined,
            id: target.path!.split('/').pop()!,
            data: () => data,
          };
        },
        update(ref: { path: string }, patch: Record<string, unknown>) {
          state.updates.push({ path: ref.path, patch });
        },
        set(ref: { path: string }, data: unknown) {
          state.sets.push({ path: ref.path, data });
        },
      };
      await fn(tx);
    },
  };

  return { adminDb, adminAuth: { setCustomUserClaims: vi.fn() } };
});

import { updateBoardMember } from './board';

const presidiumActor: UserProfile = {
  uid: 'pres-1',
  email: 'pres@gibei.test',
  full_name: 'Ketua Umum',
  nim: '1001',
  faculty_major: 'FE',
  phone_whatsapp: '08111111111',
  role: 'master_presidium',
  division_code: 'PRESIDIUM',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
};

const kadivActor: UserProfile = {
  ...presidiumActor,
  uid: 'kadiv-1',
  role: 'admin_kadiv',
  division_code: 'EDUKASI',
};

const existingMember: BoardMember = {
  id: 'm1',
  period_id: '2026-2027',
  division_id: '2026-2027_edukasi',
  division_code: 'EDUKASI',
  user_id: 'u1',
  full_name: 'Budi Santoso',
  position_title: 'Kepala Divisi Edukasi',
  order_index: 0,
  photo_url: '',
  bio: '',
  social_links: {},
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  state.docs.clear();
  state.updates.length = 0;
  state.sets.length = 0;
  state.invalidated.length = 0;
  state.revalidated.length = 0;

  state.docs.set('board_members/m1', { ...existingMember });
  state.docs.set('periods/2025-2026', { id: '2025-2026', year_range: '2025/2026', is_current: false });
  state.docs.set('divisions/2026-2027_edukasi', {
    id: '2026-2027_edukasi',
    period_id: '2026-2027',
    code: 'EDUKASI',
    head_user_id: 'u1',
  } satisfies Partial<Division>);
  state.docs.set('divisions/2025-2026_edukasi', {
    id: '2025-2026_edukasi',
    period_id: '2025-2026',
    code: 'EDUKASI',
    head_user_id: null,
  } satisfies Partial<Division>);
  state.docs.set('board_members/old1', {
    id: 'old1',
    period_id: '2025-2026',
    division_code: 'EDUKASI',
    order_index: 2,
  });
  state.docs.set('users/u1', {
    uid: 'u1',
    period_id: '2026-2027',
    division_id: '2026-2027_edukasi',
  });
});

describe('updateBoardMember cross-period move', () => {
  it('menolak kadiv memindahkan pengurus antarperiode', async () => {
    await expect(updateBoardMember(kadivActor, 'm1', { period_id: '2025-2026' })).rejects.toMatchObject({
      status: 403,
    });
  });

  it('menolak jika periode tujuan tidak ada', async () => {
    await expect(updateBoardMember(presidiumActor, 'm1', { period_id: '2024-2025' })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('memindahkan pengurus ke periode lain beserta division_id, order_index, akun user, dan membersihkan head lama', async () => {
    await updateBoardMember(presidiumActor, 'm1', { period_id: '2025-2026' });

    expect(state.updates).toContainEqual({
      path: 'board_members/m1',
      patch: expect.objectContaining({
        period_id: '2025-2026',
        division_id: '2025-2026_edukasi',
        order_index: 3,
      }),
    });
    expect(state.updates).toContainEqual({
      path: 'divisions/2026-2027_edukasi',
      patch: { head_user_id: null },
    });
    expect(state.updates).toContainEqual({
      path: 'users/u1',
      patch: {
        period_id: '2025-2026',
        division_id: '2025-2026_edukasi',
      },
    });
    expect(state.invalidated).toEqual(['board', 'periods']);
  });
});

