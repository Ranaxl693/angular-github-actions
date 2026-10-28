import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth-service';

/** The host owns authentication; remote routes inherit its root auth instance. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.initialize();
  if (auth.signedIn()) return true;
  await auth.signIn();
  return false;
};
