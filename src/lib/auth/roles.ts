import { Role, DivisionCode } from '@/types';

const ROLE_HIERARCHY: Record<Role, number> = {
  public: 0,
  member: 1,
  admin_kadiv: 2,
  master_presidium: 3,
  creator: 4,
};

export function hasMinRole(userRole: Role | undefined | null, requiredRole: Role): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

/**
 * Determines whether an actor can generate an invite for a target role.
 * - Creator: can invite master_presidium, admin_kadiv, member
 * - Presidium: can invite admin_kadiv, member
 * - Kadiv HRD: can invite member (only)
 * - Others: cannot issue invites
 */
export function canIssueInvite(
  actorRole: Role | undefined | null,
  actorDivisionCode: DivisionCode | undefined | null,
  targetRole: 'member' | 'admin_kadiv' | 'master_presidium'
): boolean {
  if (!actorRole) return false;

  if (actorRole === 'creator') {
    return true; // Creator can issue any invite
  }

  if (actorRole === 'master_presidium') {
    return targetRole === 'admin_kadiv' || targetRole === 'member';
  }

  if (actorRole === 'admin_kadiv' && actorDivisionCode === 'HRD') {
    return targetRole === 'member';
  }

  return false;
}

/**
 * Returns allowed roles that this actor can invite
 */
export function getAllowedInviteRoles(
  actorRole: Role | undefined | null,
  actorDivisionCode: DivisionCode | undefined | null
): Array<'member' | 'admin_kadiv' | 'master_presidium'> {
  const allowed: Array<'member' | 'admin_kadiv' | 'master_presidium'> = [];
  if (canIssueInvite(actorRole, actorDivisionCode, 'master_presidium')) {
    allowed.push('master_presidium');
  }
  if (canIssueInvite(actorRole, actorDivisionCode, 'admin_kadiv')) {
    allowed.push('admin_kadiv');
  }
  if (canIssueInvite(actorRole, actorDivisionCode, 'member')) {
    allowed.push('member');
  }
  return allowed;
}

