import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WorkspaceState {
  private readonly count = signal(0);
  readonly selectedCount = this.count.asReadonly();

  addItem(): void {
    this.count.update((count) => count + 1);
  }

  clear(): void {
    this.count.set(0);
  }
}
