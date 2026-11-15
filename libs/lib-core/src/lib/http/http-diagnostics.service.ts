import { Injectable, isDevMode } from '@angular/core';

/** Centralized, replaceable diagnostic logging without sensitive request data. */
@Injectable({ providedIn: 'root' })
export class HttpDiagnosticsService {
  readonly enabled = isDevMode();

  completed(method: string, durationMs: number): void {
    if (!this.enabled) return;
    console.debug('HTTP completed', { method, durationMs });
  }

  failed(status: number): void {
    if (!this.enabled) return;
    console.warn('HTTP request failed', { status });
  }
}
