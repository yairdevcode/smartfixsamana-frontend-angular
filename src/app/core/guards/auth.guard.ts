import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLogged = authService.isLoggedIn();

  if (isLogged) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
