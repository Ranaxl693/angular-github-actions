import { shareReplay } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@workspace/lib-core';

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class PostsApi {
  private readonly api = inject(ApiClient);

  private readonly posts$ = this.api
    .get<Post[]>('/posts')
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  create(request: Omit<Post, 'id'>) {
    return this.api.post<Post>('/posts', request);
  }

  list() {
    return this.posts$;
  }
}
