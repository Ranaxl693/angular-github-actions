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

  create(request: Omit<Post, 'id'>) {
    return this.api.post<Post>('/posts', request);
  }

  list() {
    return this.api.get<Post[]>('/posts');
  }
}
