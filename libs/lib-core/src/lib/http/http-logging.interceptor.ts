import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpDiagnosticsService } from './http-diagnostics.service';

/** Log request duration through a shared injectable diagnostics service. */
export const httpLoggingInterceptor: HttpInterceptorFn = (request, next) => {
  const diagnostics = inject(HttpDiagnosticsService);
  if (!diagnostics.enabled) return next(request);

  const started = performance.now();
  return next(request).pipe(
    finalize(() => diagnostics.completed(request.method, performance.now() - started)),
  );
};
