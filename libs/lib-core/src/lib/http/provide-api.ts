import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_CONFIG, ApiConfig } from './api-config';

/** Configure once in each application bootstrap, including standalone remotes. */
export function provideApi(
  config: ApiConfig,
  interceptors: HttpInterceptorFn[] = [],
): EnvironmentProviders {
  if (!config.baseUrl.trim()) {
    throw new Error('API baseUrl must not be empty.');
  }

  return makeEnvironmentProviders([
    { provide: API_CONFIG, useValue: Object.freeze({ ...config }) },
    provideHttpClient(withInterceptors(interceptors)),
  ]);
}
