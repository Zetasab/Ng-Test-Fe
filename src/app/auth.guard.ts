import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const AUTH_SESSION_KEY = 'isAuthenticated';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';

  if (isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
