import { Component, inject } from '@angular/core';
import { WorkspaceState } from '@workspace/lib-core';
import { Card } from '@workspace/lib-ui/card';
import { MfeLocalStore, PostsStore } from '@workspace/lib-state';

@Component({
  selector: 'app-mfe1',
  imports: [Card],
  providers: [MfeLocalStore],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly workspace = inject(WorkspaceState);
  protected readonly postsStore = inject(PostsStore);
  protected readonly local = inject(MfeLocalStore);
  protected readonly products = ['Angular Handbook', 'Nx', 'Native Federation Workshop', 'mfe-11'];

  protected loadPosts(): void { void this.postsStore.load(); }
  protected refreshPosts(): void { void this.postsStore.refresh(); }
  protected setLocalFilter(value: string): void { this.local.updateFilter(value); }
}
