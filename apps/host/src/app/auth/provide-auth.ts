import { computed, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { AUTH_SESSION, AuthSession } from '@workspace/lib-core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalInterceptor,
  MsalService,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  InteractionType,
  PublicClientApplication,
} from '@azure/msal-browser';
import { AUTH_CONFIG, AuthConfig } from './auth-config';
import { AuthService } from './auth-service';

/** Register once in the host root. Federated components inherit these providers. */
export function provideAuth(config: AuthConfig) {
  return makeEnvironmentProviders([
    { provide: AUTH_CONFIG, useValue: config },
    {
      provide: MSAL_INSTANCE,
      useFactory: () =>
        new PublicClientApplication({
          auth: {
            clientId: config.clientId,
            authority: `https://login.microsoftonline.com/${config.tenantId}`,
            redirectUri: config.redirectUri,
            postLogoutRedirectUri: config.postLogoutRedirectUri,
          },
          cache: { cacheLocation: BrowserCacheLocation.SessionStorage },
        }),
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useValue: {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map<string, string[]>(),
      },
    },
    MsalService,
    MsalBroadcastService,
    {
      provide: AUTH_SESSION,
      useFactory: (): AuthSession => {
        const auth = inject(AuthService);
        return Object.freeze({
          signedIn: auth.signedIn,
          user: computed(() => {
            const account = auth.account();
            return account
              ? Object.freeze({
                  name: account.name ?? account.username,
                  username: account.username,
                  homeAccountId: account.homeAccountId,
                  tenantId: account.tenantId,
                })
              : null;
          }),
        });
      },
    },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    provideAppInitializer(() => inject(AuthService).initialize()),
  ]);
}
