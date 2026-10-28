import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AUTH_SESSION, WorkspaceState } from '@workspace/lib-core';
import { App } from './app';

describe('mfe1', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AUTH_SESSION,
          useValue: { user: signal(null), signedIn: signal(false) },
        },
      ],
    });
  });
  it('adds to the shared selection', async () => {
    const fixture = TestBed.createComponent(App);
    const state = TestBed.inject(WorkspaceState);
    state.clear();
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    await fixture.whenStable();
    expect(state.selectedCount()).toBe(1);
  });
});
