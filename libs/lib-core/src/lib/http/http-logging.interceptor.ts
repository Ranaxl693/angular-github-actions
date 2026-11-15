import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';

/** Log method and duration without URLs, tokens, or request/response bodies. */
export const httpLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = Date.now();
  return next(req).pipe(
    finalize(() => console.debug('HTTP completed', {
      method: req.method,
      durationMs: Date.now() - started,
    })),
  );
};
