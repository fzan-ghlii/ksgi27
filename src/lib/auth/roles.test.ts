import { describe, it, expect } from 'vitest';
import { hasMinRole, canIssueInvite, getAllowedInviteRoles } from './roles';

describe('RBAC Role Hierarchy', () => {
  it('correctly compares roles according to hierarchy', () => {
    expect(hasMinRole('creator', 'creator')).toBe(true);
    expect(hasMinRole('creator', 'master_presidium')).toBe(true);
    expect(hasMinRole('creator', 'member')).toBe(true);

    expect(hasMinRole('master_presidium', 'creator')).toBe(false);
    expect(hasMinRole('master_presidium', 'master_presidium')).toBe(true);
    expect(hasMinRole('master_presidium', 'admin_kadiv')).toBe(true);

    expect(hasMinRole('admin_kadiv', 'master_presidium')).toBe(false);
    expect(hasMinRole('admin_kadiv', 'admin_kadiv')).toBe(true);
    expect(hasMinRole('admin_kadiv', 'member')).toBe(true);

    expect(hasMinRole('member', 'admin_kadiv')).toBe(false);
    expect(hasMinRole('public', 'member')).toBe(false);
    expect(hasMinRole(null, 'member')).toBe(false);
  });
});

describe('canIssueInvite permissions', () => {
  it('allows Creator to issue all roles', () => {
    expect(canIssueInvite('creator', 'PRESIDIUM', 'master_presidium')).toBe(true);
    expect(canIssueInvite('creator', 'PRESIDIUM', 'admin_kadiv')).toBe(true);
    expect(canIssueInvite('creator', 'PRESIDIUM', 'member')).toBe(true);
    expect(getAllowedInviteRoles('creator', 'PRESIDIUM')).toEqual([
      'master_presidium',
      'admin_kadiv',
      'member',
    ]);
  });

  it('allows Presidium to issue Kadiv and Member invites, but not Presidium', () => {
    expect(canIssueInvite('master_presidium', 'PRESIDIUM', 'master_presidium')).toBe(false);
    expect(canIssueInvite('master_presidium', 'PRESIDIUM', 'admin_kadiv')).toBe(true);
    expect(canIssueInvite('master_presidium', 'PRESIDIUM', 'member')).toBe(true);
    expect(getAllowedInviteRoles('master_presidium', 'PRESIDIUM')).toEqual([
      'admin_kadiv',
      'member',
    ]);
  });

  it('allows Kadiv HRD to issue Member invites only', () => {
    expect(canIssueInvite('admin_kadiv', 'HRD', 'master_presidium')).toBe(false);
    expect(canIssueInvite('admin_kadiv', 'HRD', 'admin_kadiv')).toBe(false);
    expect(canIssueInvite('admin_kadiv', 'HRD', 'member')).toBe(true);
    expect(getAllowedInviteRoles('admin_kadiv', 'HRD')).toEqual(['member']);
  });

  it('disallows non-HRD Kadiv from issuing invites', () => {
    expect(canIssueInvite('admin_kadiv', 'INVESTASI', 'member')).toBe(false);
    expect(canIssueInvite('admin_kadiv', 'KEGIATAN', 'member')).toBe(false);
    expect(getAllowedInviteRoles('admin_kadiv', 'INVESTASI')).toEqual([]);
  });

  it('disallows regular Members and Public from issuing invites', () => {
    expect(canIssueInvite('member', 'HRD', 'member')).toBe(false);
    expect(canIssueInvite('public', null, 'member')).toBe(false);
  });
});

