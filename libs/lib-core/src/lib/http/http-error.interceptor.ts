import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Central place for HTTP error policy. Preserve the original error so each
 * MFE can handle domain-specific failures without losing status or payload.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        // Avoid logging request URLs, tokens, or response bodies.
        console.warn('HTTP request failed', { status: error.status });
      }
      return throwError(() => error);
    }),
  );
