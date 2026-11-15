import { provideApi } from '@workspace/lib-core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WorkspaceState } from '@workspace/lib-core';
import { App } from './app';

describe('mfe1', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApi({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
        provideHttpClientTesting(),
      ],
    });
  });
  afterEach(() => {
    const http = TestBed.inject(HttpTestingController);
    for (const request of http.match('https://jsonplaceholder.typicode.com/posts'))
      request.flush([]);
    http.verify();
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
