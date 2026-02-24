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
  const rawUser = sessionStorage.getItem(USER_SESSION_KEY);

  if (!rawUser) {
    return router.createUrlTree(['/login']);
  }

  let user: UserResponse | null = null;

  try {
    user = JSON.parse(rawUser) as UserResponse;
  } catch {
    return router.createUrlTree(['/login']);
  }

  if (isAdminUser(user)) {
    return true;
  }

  return router.createUrlTree(['/']);
};

function isAdminUser(user: UserResponse): boolean {
  const userWithFlexibleRole = user as UserResponse & {
    roleId?: unknown;
    userRole?: unknown;
  };

  const candidates = [user.role, userWithFlexibleRole.roleId, userWithFlexibleRole.userRole];

  return candidates.some((candidate) => isAdminRoleValue(candidate));
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
