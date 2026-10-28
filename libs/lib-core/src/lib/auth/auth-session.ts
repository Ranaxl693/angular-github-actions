import { InjectionToken, Signal } from '@angular/core';

export interface AuthUser {
  readonly name: string;
  readonly username: string;
  readonly homeAccountId: string;
  readonly tenantId: string;
}

/** Read-only data contract for remotes. No MSAL client, tokens, or auth actions. */
export interface AuthSession {
  readonly user: Signal<AuthUser | null>;
  readonly signedIn: Signal<boolean>;
}

export const AUTH_SESSION = new InjectionToken<AuthSession>('AUTH_SESSION');
