import { HttpContextToken } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize } from 'rxjs';
import { LoadingService } from './loading.service';

/** Set to false for background HTTP calls that should not affect global loading. */
export const SHOW_GLOBAL_LOADER = new HttpContextToken<boolean>(() => true);

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.context.get(SHOW_GLOBAL_LOADER)) {
    return next(request);
  }

  const loading = inject(LoadingService);
  return defer(() => {
    loading.start();
    return next(request).pipe(finalize(() => loading.stop()));
  });
};
