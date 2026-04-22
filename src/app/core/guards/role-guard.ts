import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { Role } from '../config/roles';

export function roleGuard(allowedRoles: readonly Role[]): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    if (allowedRoles.length === 0 || auth.hasAnyRole(allowedRoles)) {
      return true;
    }
    return router.createUrlTree(['/error/403']);
  };
}
