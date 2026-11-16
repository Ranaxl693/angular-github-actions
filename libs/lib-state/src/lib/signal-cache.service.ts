import { Injectable, computed, signal } from '@angular/core';
import { Observable, defer, finalize, firstValueFrom, shareReplay } from 'rxjs';

export interface CacheEntry<T> {
  readonly data: T;
  readonly loadedAt: number;
  readonly expiresAt: number;
}

interface StoredEntry {
  readonly data: unknown;
  readonly loadedAt: number;
  readonly expiresAt: number;
}

/** Per-shell, in-memory cache. No browser persistence or sensitive data logging. */
@Injectable({ providedIn: 'root' })
export class SignalCache {
  private readonly entries = signal<ReadonlyMap<string, StoredEntry>>(new Map());
  private readonly pending = new Map<string, Observable<unknown>>();
  readonly size = computed(() => this.entries().size);

  select<T>(key: string) {
    return computed(() => this.peek<T>(key));
  }

  peek<T>(key: string): T | undefined {
    const entry = this.entries().get(key);
    if (!entry || entry.expiresAt <= Date.now()) return undefined;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs = 5 * 60_000): void {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new Error('ttlMs must be positive');
    const now = Date.now();
    this.entries.update(current => new Map(current).set(key, {
      data, loadedAt: now, expiresAt: now + ttlMs,
    }));
  }

  /** Concurrent callers share one network request; failed requests never get cached. */
  load<T>(key: string, factory: () => Observable<T>, ttlMs = 5 * 60_000, force = false): Observable<T> {
    if (!force) {
      const existing = this.peek<T>(key);
      if (existing !== undefined) return defer(() => Promise.resolve(existing));
    }
    const inflight = this.pending.get(key) as Observable<T> | undefined;
    if (inflight) return inflight;
    const request = defer(factory).pipe(
      // Multicast to concurrent MFE subscribers without reissuing HTTP.
      // The subscription starts only when a consumer subscribes.
      shareReplay({ bufferSize: 1, refCount: true }),
      finalize(() => {
        // Clean up after each subscription, provided this is still the active entry.
        if (this.pending.get(key) === request) this.pending.delete(key);
      }),
    );
    this.pending.set(key, request);
    return request;
  }

  async getOrLoad<T>(key: string, factory: () => Observable<T>, ttlMs = 5 * 60_000, force = false): Promise<T> {
    const data = await firstValueFrom(this.load(key, factory, ttlMs, force));
    this.set(key, data, ttlMs);
    return data;
  }

  invalidate(key: string): void {
    this.entries.update(current => {
      const next = new Map(current);
      next.delete(key);
      return next;
    });
  }

  clear(): void {
    this.entries.set(new Map());
    this.pending.clear();
  }

  prune(): void {
    const now = Date.now();
    this.entries.update(current => new Map([...current].filter(([, entry]) => entry.expiresAt > now)));
  }
}
