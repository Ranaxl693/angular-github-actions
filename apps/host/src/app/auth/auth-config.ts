import { InjectionToken } from '@angular/core';

export interface AuthConfig {
  readonly clientId: string;
  readonly tenantId: string;
  readonly redirectUri: string;
  readonly postLogoutRedirectUri: string;
  readonly loginScopes: readonly string[];
}

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
