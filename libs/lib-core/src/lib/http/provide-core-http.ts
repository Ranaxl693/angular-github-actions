import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { requestIdInterceptor } from './request-id.interceptor';
import { httpLoggingInterceptor } from './http-logging.interceptor';
import { httpErrorInterceptor } from './http-error.interceptor';

/** Shared HTTP policy for every Angular application root injector. */
export function provideCoreHttp() {
  return provideHttpClient(
    withInterceptors([
      requestIdInterceptor,
      httpLoggingInterceptor,
      httpErrorInterceptor,
    ]),
  );
}
