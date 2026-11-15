import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { requestHeadersInterceptor } from './request-headers.interceptor';
import { httpLoggingInterceptor } from './http-logging.interceptor';
import { httpErrorInterceptor } from './http-error.interceptor';
import { loadingInterceptor } from './loading.interceptor';

/**
 * Shared HTTP configuration for independently bootstrapped Angular applications.
 * Optionally append application-specific interceptors without duplicating common ones.
 * Federated components use the host's HTTP injector unless a child overrides it.
 */
export function provideCoreHttp(additionalInterceptors: HttpInterceptorFn[] = []) {
  return provideHttpClient(
    withInterceptors([
      requestHeadersInterceptor,
      httpLoggingInterceptor,
      httpErrorInterceptor,
      loadingInterceptor,
      ...additionalInterceptors,
    ]),
  );
}
