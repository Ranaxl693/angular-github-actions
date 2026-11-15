import { Component, inject, signal } from '@angular/core';
import { WorkspaceState } from '@workspace/lib-core';
import { Card } from '@workspace/lib-ui';
import { JsonPlaceholderService } from './json-placeholder.service';
import type { JsonPlaceholderPost } from './json-placeholder.service';

@Component({
  selector: 'app-mfe1',
  imports: [Card],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly workspace = inject(WorkspaceState);
  private readonly api = inject(JsonPlaceholderService);
  protected readonly products = ['Angular Handbook', 'Nx', 'Native Federation Workshop', 'mfe-11'];
  protected readonly posts = signal<JsonPlaceholderPost[]>([]);
  protected readonly loadingPosts = signal(false);
  protected readonly postsError = signal('');

  protected loadPosts(): void {
    this.loadingPosts.set(true);
    this.postsError.set('');
    this.api.getPosts().subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loadingPosts.set(false);
      },
      error: () => {
        this.postsError.set('Unable to load demo posts. Try again.');
        this.loadingPosts.set(false);
      },
    });
  }
}
