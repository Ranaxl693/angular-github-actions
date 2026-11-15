import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkspaceState, provideApi } from '@workspace/lib-core';
import { App } from './app';

const endpoint = 'https://jsonplaceholder.typicode.com/posts';

describe('mfe2', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApi({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('clears the shared selection', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const state = TestBed.inject(WorkspaceState);
    state.addItem();
    http.expectOne(endpoint).flush([]);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    await fixture.whenStable();
    expect(state.selectedCount()).toBe(0);
  });

  it('shows loading state and renders posts fetched through ApiClient', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Loading posts');
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 1, userId: 2, title: 'First post', body: 'Post content' }]);
    await fixture.whenStable();
    expect(element.querySelectorAll('[data-testid="post"]').length).toBe(1);
    expect(element.querySelector('[data-testid="preview-post"]')?.textContent).toContain(
      'First post',
    );
    expect(element.textContent).toContain('First post');
    expect(element.textContent).toContain('Post content');
    expect(element.querySelector('[role="status"]')).toBeNull();
  });

  it('shows an error when the API fails', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne(endpoint).flush(null, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent,
    ).toContain('Could not load posts');
  });

  it('shows an empty state', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne(endpoint).flush([]);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No posts found.');
  });
});
