import { APP_BASE_HREF } from '@angular/common';
import { ApplicationConfig, DOCUMENT, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import type { NativeFederationResult } from '@angular-architects/native-federation';
import { routes } from './app.routes';

export const appConfig = (federation: NativeFederationResult): ApplicationConfig => ({
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Resolve a relative <base> once, including the parent base used by Pages route entries.
    {
      provide: APP_BASE_HREF,
      useFactory: (document: Document) => new URL(document.baseURI).pathname,
      deps: [DOCUMENT],
    },
    provideRouter(routes(federation)),
  ],
});
