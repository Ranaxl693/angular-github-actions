import { HttpInterceptorFn } from '@angular/common/http';

/** Example of a shared header policy; do not add custom headers to third-party APIs. */
export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  // Relative URLs are application-owned; cross-origin JSONPlaceholder stays untouched.
  if (/^https?:\/\//i.test(req.url) || req.headers.has('X-Request-Source')) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { 'X-Request-Source': 'angular-mfe' } }));
};
