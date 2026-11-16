import { HttpErrorResponse } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { HttpDiagnosticsService } from './http-diagnostics.service';

/** Preserve original HTTP errors for MFE-specific handling. */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const diagnostics = inject(HttpDiagnosticsService);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) diagnostics.failed(error.status);
      return throwError(() => error);
    }),
  );
};
