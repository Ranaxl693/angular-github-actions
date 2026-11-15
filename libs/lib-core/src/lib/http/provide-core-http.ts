import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { requestIdInterceptor } from './request-id.interceptor';
import { httpLoggingInterceptor } from './http-logging.interceptor';
import { httpErrorInterceptor } from './http-error.interceptor';

/**
 * Shared HTTP configuration for independently bootstrapped Angular applications.
 * Optionally append application-specific interceptors without duplicating common ones.
 * Federated components use the host's HTTP injector unless a child overrides it.
 */
export function provideCoreHttp(additionalInterceptors: HttpInterceptorFn[] = []) {
  return provideHttpClient(
    withInterceptors([
      requestIdInterceptor,
      httpLoggingInterceptor,
      httpErrorInterceptor,
      ...additionalInterceptors,
    ]),
  );
}
