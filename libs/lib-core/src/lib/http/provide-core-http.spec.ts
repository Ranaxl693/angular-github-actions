import { HttpClient } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideCoreHttp } from './provide-core-http';
import { ACCESS_TOKEN_RESOLVER, PROTECTED_API_URLS } from './auth.interceptor';

describe('provideCoreHttp', () => {
  it('registers HttpClient and applies the shared request interceptor', () => {
    TestBed.configureTestingModule({
      providers: [provideCoreHttp(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    let result: { ok: boolean } | undefined;
    http.get<{ ok: boolean }>('/api/check').subscribe((response) => { result = response; });
    const request = controller.expectOne('/api/check');
    expect(request.request.headers.get('X-Request-Source')).toBe('angular-mfe');
    request.flush({ ok: true });
    expect(result).toEqual({ ok: true });
    controller.verify();
  });

  it('does not attach custom headers to third-party requests', () => {
    TestBed.configureTestingModule({
      providers: [provideCoreHttp(), provideHttpClientTesting()],
    });
    TestBed.inject(HttpClient).get('https://jsonplaceholder.typicode.com/posts').subscribe();
    const controller = TestBed.inject(HttpTestingController);
    const request = controller.expectOne('https://jsonplaceholder.typicode.com/posts');
    expect(request.request.headers.has('X-Request-Source')).toBe(false);
    request.flush([]);
    controller.verify();
  });
  it('runs an optional application interceptor alongside common interceptors', () => {
    const mfeInterceptor: HttpInterceptorFn = (req, next) =>
      next(req.clone({ setHeaders: { 'X-MFE': 'mfe1' } }));
    TestBed.configureTestingModule({
      providers: [provideCoreHttp([mfeInterceptor]), provideHttpClientTesting()],
    });
    TestBed.inject(HttpClient).get('/api/example').subscribe();
    const controller = TestBed.inject(HttpTestingController);
    const request = controller.expectOne('/api/example');
    expect(request.request.headers.get('X-Request-Source')).toBe('angular-mfe');
    expect(request.request.headers.get('X-MFE')).toBe('mfe1');
    request.flush({});
    controller.verify();
  });
  it('attaches a resolved token only to explicitly protected API routes', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideCoreHttp(),
        provideHttpClientTesting(),
        { provide: PROTECTED_API_URLS, useValue: ['https://api.example.com/private'] },
        { provide: ACCESS_TOKEN_RESOLVER, useValue: async () => 'demo-token' },
      ],
    });
    const client = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    client.get('https://api.example.com/private/items').subscribe();
    client.get('https://jsonplaceholder.typicode.com/posts').subscribe();
    await Promise.resolve();
    const privateRequest = controller.expectOne('https://api.example.com/private/items');
    expect(privateRequest.request.headers.get('Authorization')).toBe('Bearer demo-token');
    const publicRequest = controller.expectOne('https://jsonplaceholder.typicode.com/posts');
    expect(publicRequest.request.headers.has('Authorization')).toBe(false);
    privateRequest.flush({});
    publicRequest.flush({});
    controller.verify();
  });
});
