import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { cacheKey } from './cache-key';
import { SignalCache } from './signal-cache.service';

export interface DemoPost {
  readonly userId: number;
  readonly id: number;
  readonly title: string;
  readonly body: string;
}

const KEY = cacheKey('demo', 'posts', 'public', { limit: 5 });
const URL = 'https://jsonplaceholder.typicode.com/posts?_limit=5';

/** Shared by all federated remotes within a single Angular host injector. */
@Injectable({ providedIn: 'root' })
export class PostsStore {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(SignalCache);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly requestVersion = signal(0);

  readonly posts = this.cache.select<readonly DemoPost[]>(KEY);
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly hasData = computed(() => !!this.posts()?.length);
  readonly version = this.requestVersion.asReadonly();

  async load(force = false): Promise<void> {
    if (!force && this.posts() !== undefined) return;
    const version = this.requestVersion() + 1;
    this.requestVersion.set(version);
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      await this.cache.getOrLoad(KEY, () => this.http.get<DemoPost[]>(URL), 5 * 60_000, force);
    } catch {
      if (version === this.requestVersion()) this.errorState.set('Unable to load posts. Try again.');
    } finally {
      if (version === this.requestVersion()) this.loadingState.set(false);
    }
  }

  refresh(): Promise<void> { return this.load(true); }

  clear(): void {
    this.requestVersion.update(v => v + 1);
    this.cache.invalidate(KEY);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
