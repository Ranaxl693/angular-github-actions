import { AuthConfig } from './auth/auth-config';

/** Public SPA identifiers; never put a client secret in a browser application. */
export function authConfig(baseUri: string): AuthConfig {
  const redirectUri = new URL('.', baseUri).href;
  return {
    clientId: '71a701a8-73f5-41a0-a165-6a88619dcd7e',
    tenantId: 'a5029e0a-de26-4653-bc21-97b7eccf2897',
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    loginScopes: ['openid', 'profile'],
  };
}
