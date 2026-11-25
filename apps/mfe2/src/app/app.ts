import { Component, inject } from '@angular/core';
import { WorkspaceState } from '@workspace/lib-core';
import { Button } from '@workspace/ui-button';
import { MfeLocalStore, PostsStore } from '@workspace/lib-state';

@Component({
  selector: 'app-mfe2',
  imports: [Button],
  providers: [MfeLocalStore],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly workspace = inject(WorkspaceState);
  protected readonly postsStore = inject(PostsStore);
  protected readonly local = inject(MfeLocalStore);
  protected loadPosts(): void { void this.postsStore.load(); }
  protected setLocalFilter(value: string): void { this.local.updateFilter(value); }
}
