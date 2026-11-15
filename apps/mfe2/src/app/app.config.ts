import { provideApi } from '@workspace/lib-core';
import { environment } from '../environments/environment';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideApi({ baseUrl: environment.apiBaseUrl }),
    provideRouter(routes),
  ],
};
