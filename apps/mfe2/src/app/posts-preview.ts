import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Card } from '@workspace/lib-ui';
import { Post, PostsApi } from './posts-api';

@Component({
  selector: 'app-posts-preview',
  imports: [Card],
  template: `
    <app-ui-card title="Posts in another component">
      <p>This component injects the same PostsApi service. Showing the first five posts.</p>
      @if (loading()) {
        <p role="status">Loading preview…</p>
      } @else if (error()) {
        <p role="alert">Could not load the preview.</p>
      } @else {
        <ul>
          @for (post of posts(); track post.id) {
            <li data-testid="preview-post">
              <strong>{{ post.title }}</strong>
              <p>{{ post.body }}</p>
            </li>
          } @empty {
            <li>No posts found.</li>
          }
        </ul>
      }
    </app-ui-card>
  `,
})
export class PostsPreview {
  protected readonly posts = signal<Post[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  constructor() {
    inject(PostsApi)
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (posts) => {
          this.posts.set(posts.slice(0, 5));
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
