import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Placeholder — implemented in Story 4.2
// Protects /admin/* routes; redirects to /admin/login if not authenticated
// NEVER rely on this guard alone for API security — [Authorize] on controllers is the real gate
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/admin/login']);
};
