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

  if (user.role === UserRole.Admin) {
    return true;
  }

  return router.createUrlTree(['/']);
};
