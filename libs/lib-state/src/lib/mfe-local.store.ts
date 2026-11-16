import { Injectable, signal } from '@angular/core';

/** Provide at MFE route/component level, never at root. */
@Injectable()
export class MfeLocalStore {
  private readonly filterState = signal('');
  readonly filter = this.filterState.asReadonly();
  updateFilter(value: string): void { this.filterState.set(value); }
  reset(): void { this.filterState.set(''); }
}
