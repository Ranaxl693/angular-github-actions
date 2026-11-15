import { HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { from, switchMap } from 'rxjs';

/** Host application supplies the correct MSAL token for the requested URL. */
export type AccessTokenResolver = (url: string) => Promise<string | null>;
export const ACCESS_TOKEN_RESOLVER = new InjectionToken<AccessTokenResolver>('ACCESS_TOKEN_RESOLVER');
/** Explicit HTTPS API path prefixes; no token is attached outside this allowlist. */
export const PROTECTED_API_URLS = new InjectionToken<readonly string[]>('PROTECTED_API_URLS');

function isAllowed(url: string, prefix: string): boolean {
  if (!prefix.startsWith('https://')) return false;
  const base = prefix.replace(/\/+$/, '');
  return url === base || url.startsWith(base + '/') || url.startsWith(base + '?');
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const resolveToken = inject(ACCESS_TOKEN_RESOLVER, { optional: true });
  const protectedUrls = inject(PROTECTED_API_URLS, { optional: true });

  // No authentication provider is installed in the demo app; leave requests intact.
  if (!resolveToken || !protectedUrls?.some((prefix) => isAllowed(request.url, prefix))) {
    return next(request);
  }

  return from(resolveToken(request.url)).pipe(
    switchMap((token) =>
      next(token
        ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : request),
    ),
  );
};
