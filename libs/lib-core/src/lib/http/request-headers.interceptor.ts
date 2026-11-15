import type { HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';

/**
 * Headers configured by the host application for same-origin (relative) API URLs.
 * Custom headers on third-party URLs can trigger CORS preflight or leak data,
 * so absolute URLs are excluded by default.
 */
export const COMMON_REQUEST_HEADERS = new InjectionToken<Readonly<Record<string, string>>>(
  'COMMON_REQUEST_HEADERS',
  { factory: () => ({ 'X-Request-Source': 'angular-mfe' }) },
);

export const requestHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  if (/^[a-z][a-z\d+.-]*:/i.test(req.url) || req.url.startsWith('//')) {
    return next(req);
  }

  const configuredHeaders = inject(COMMON_REQUEST_HEADERS);
  const missingHeaders = Object.fromEntries(
    Object.entries(configuredHeaders).filter(([name]) => !req.headers.has(name)),
  );
  return Object.keys(missingHeaders).length
    ? next(req.clone({ setHeaders: missingHeaders }))
    : next(req);
};
