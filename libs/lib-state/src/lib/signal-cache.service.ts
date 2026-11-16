import { Injectable, computed, signal } from '@angular/core';
import { Observable, defer, finalize, firstValueFrom, of, shareReplay, tap } from 'rxjs';

interface StoredEntry {
  readonly data: unknown;
  readonly loadedAt: number;
  readonly expiresAt: number;
}

export interface CacheEntry<T> {
  readonly data: T;
  readonly loadedAt: number;
  readonly expiresAt: number;
}

/** Reactive in-memory cache, scoped to one Angular root injector. */
@Injectable({ providedIn: 'root' })
export class SignalCache {
  private readonly entries = signal<ReadonlyMap<string, StoredEntry>>(new Map());
  private readonly pending = new Map<string, Observable<unknown>>();
  private readonly generations = new Map<string, number>();
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

  load<T>(key: string, factory: () => Observable<T>, ttlMs = 5 * 60_000, force = false): Observable<T> {
    if (!force) {
      const existing = this.peek<T>(key);
      if (existing !== undefined) return of(existing);
    }
    const pending = this.pending.get(key) as Observable<T> | undefined;
    if (pending) return pending;
    const generation = this.generations.get(key) ?? 0;
    // finalize is upstream of shareReplay so only the source completion clears pending.
    const request = defer(factory).pipe(
      tap(data => {
        // An invalidated/cleared request must not restore old data.
        if (this.generations.get(key) === generation || (!this.generations.has(key) && generation === 0)) {
          this.set(key, data, ttlMs);
        }
      }),
      finalize(() => {
        if (this.pending.get(key) === request) this.pending.delete(key);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.pending.set(key, request);
    return request;
  }

  getOrLoad<T>(key: string, factory: () => Observable<T>, ttlMs = 5 * 60_000, force = false): Promise<T> {
    return firstValueFrom(this.load(key, factory, ttlMs, force));
  }

  invalidate(key: string): void {
    this.generations.set(key, (this.generations.get(key) ?? 0) + 1);
    this.pending.delete(key);
    this.entries.update(current => {
      const next = new Map(current);
      next.delete(key);
      return next;
    });
  }

  clear(): void {
    for (const key of this.pending.keys()) this.generations.set(key, (this.generations.get(key) ?? 0) + 1);
    this.entries.set(new Map());
    this.pending.clear();
  }

  prune(): void {
    const now = Date.now();
    this.entries.update(current => new Map([...current].filter(([, entry]) => entry.expiresAt > now)));
  }
}
