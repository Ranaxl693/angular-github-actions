import { HttpContextToken } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';

/**
 * Explicit custom headers for a selected HTTP request.
 * Defaults to null so other requests remain unchanged.
 * Never place secrets in browser-supplied headers.
 */
export const REQUEST_CUSTOM_HEADERS =
  new HttpContextToken<Readonly<Record<string, string>> | null>(() => null);

export const requestHeadersInterceptor: HttpInterceptorFn = (request, next) => {
  const headers = request.context.get(REQUEST_CUSTOM_HEADERS);
  if (!headers) {
    return next(request);
  }

  // Keep headers already specified by the caller; avoid unnecessary cloning.
  const missingHeaders = Object.fromEntries(
    Object.entries(headers).filter(([name]) => !request.headers.has(name)),
  );

  return Object.keys(missingHeaders).length
    ? next(request.clone({ setHeaders: missingHeaders }))
    : next(request);
};
