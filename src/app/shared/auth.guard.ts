import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserResponse, UserRole } from '../../models/user-response.model';

export const AUTH_SESSION_KEY = 'isAuthenticated';
export const USER_SESSION_KEY = 'userResponse';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';

  if (isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = getSessionUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (isAdminUser(user)) {
    return true;
  }

  return router.createUrlTree(['/']);
};

export function getSessionUser(): UserResponse | null {
  const rawUser = sessionStorage.getItem(USER_SESSION_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as UserResponse;
  } catch {
    return null;
  }
}

export function isCurrentUserAdmin(): boolean {
  const user = getSessionUser();
  return !!user && isAdminUser(user);
}

export function hasCurrentUserAnyPermission(requiredPermissions: readonly string[]): boolean {
  if (!requiredPermissions.length) {
    return true;
  }

  const user = getSessionUser();

  if (!user) {
    return false;
  }

  const normalizedPermissions = new Set(getPermissionCandidates(user));

  return requiredPermissions
    .map((permission) => permission.trim().toLowerCase())
    .some((permission) => normalizedPermissions.has(permission));
}

function isAdminUser(user: UserResponse): boolean {
  const userWithFlexibleRole = user as UserResponse & {
    roleId?: unknown;
    userRole?: unknown;
  };

  const candidates = [user.role, userWithFlexibleRole.roleId, userWithFlexibleRole.userRole];

  return candidates.some((candidate) => isAdminRoleValue(candidate));
}

function getPermissionCandidates(user: UserResponse): string[] {
  const userAsRecord = user as UserResponse & {
    permissions?: unknown;
    permission?: unknown;
    claims?: unknown;
  };

  const sources = [userAsRecord.permissions, userAsRecord.permission, userAsRecord.claims];

  return sources.flatMap((source) => normalizePermissionSource(source));
}

function normalizePermissionSource(source: unknown): string[] {
  if (typeof source === 'string') {
    return source
      .split(',')
      .map((permission) => permission.trim().toLowerCase())
      .filter((permission) => !!permission);
  }

  if (Array.isArray(source)) {
    return source.flatMap((item) => normalizePermissionSource(item));
  }

  if (isObjectLike(source)) {
    const permissionRecord = source as Record<string, unknown>;

    return [permissionRecord['code'], permissionRecord['name'], permissionRecord['value']]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => !!value);
  }

  return [];
}

function isAdminRoleValue(role: unknown): boolean {
  if (typeof role === 'number') {
    return role === 1;
  }

  if (typeof role === 'string') {
    const normalizedRole = role.trim().toLowerCase();
    return normalizedRole === UserRole.Admin.toLowerCase() || normalizedRole === '1';
  }

  if (isObjectLike(role)) {
    const roleRecord = role as Record<string, unknown>;
    return isAdminRoleValue(roleRecord['id']) || isAdminRoleValue(roleRecord['name']);
  }

  return false;
}

function isObjectLike(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
