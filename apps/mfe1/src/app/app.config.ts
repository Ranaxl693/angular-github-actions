import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCoreHttp } from '@workspace/lib-core';
import { routes } from './app.routes';

// Used when MFE1 is bootstrapped on its own; the federated component uses host providers.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideCoreHttp(), provideRouter(routes)],
};
