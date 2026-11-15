import { PostsPreview } from './posts-preview';
import { FormsModule } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostsApi, Post } from './posts-api';
import { Component, inject, signal } from '@angular/core';
import { WorkspaceState } from '@workspace/lib-core';
import { Card } from '@workspace/lib-ui';

@Component({
  selector: 'app-mfe2',
  imports: [FormsModule, Card, PostsPreview],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly workspace = inject(WorkspaceState);
  private readonly postsApi = inject(PostsApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly saved = signal(false);
  protected draftTitle = '';
  protected draftBody = '';

  protected createPost(): void {
    if (this.saving() || !this.draftTitle.trim() || !this.draftBody.trim()) return;
    this.saving.set(true);
    this.saveError.set('');
    this.saved.set(false);
    this.postsApi
      .create({ title: this.draftTitle.trim(), body: this.draftBody.trim(), userId: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post) => {
          // JSONPlaceholder reuses the synthetic ID; keep local list keys unique.
          this.posts.update((posts) => [post, ...posts.filter((item) => item.id !== post.id)]);
          this.draftTitle = '';
          this.draftBody = '';
          this.saving.set(false);
          this.saved.set(true);
        },
        error: () => {
          this.saveError.set('Could not create post. Your input has been preserved.');
          this.saving.set(false);
        },
      });
  }

  protected readonly posts = signal<Post[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    inject(PostsApi)
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (posts) => {
          this.posts.set(posts);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load posts. Please try again later.');
          this.loading.set(false);
        },
      });
  }
}
