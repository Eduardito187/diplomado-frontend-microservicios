import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { Role } from '../config/roles';

export function ensureRole(
  allowedRoles: readonly Role[],
  auth: Auth,
  router: Router
): boolean {
  if (allowedRoles.length === 0 || auth.hasAnyRole(allowedRoles)) return true;
  router.navigateByUrl('/error/403');
  return false;
}
