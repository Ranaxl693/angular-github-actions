import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PostsStore } from './posts.store';

describe('PostsStore', () => {
  it('shares the same cached result without repeated HTTP', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const store = TestBed.inject(PostsStore);
    const http = TestBed.inject(HttpTestingController);
    const first = store.load();
    http.expectOne('https://jsonplaceholder.typicode.com/posts?_limit=5').flush([
      { userId: 1, id: 1, title: 'Example', body: 'Body' },
    ]);
    await first;
    await store.load();
    expect(store.posts()?.length).toBe(1);
    http.expectNone('https://jsonplaceholder.typicode.com/posts?_limit=5');
    http.verify();
  });
});
