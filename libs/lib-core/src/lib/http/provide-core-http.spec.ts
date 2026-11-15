import { HttpClient, HttpContext } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideCoreHttp } from './provide-core-http';
import { REQUEST_CUSTOM_HEADERS } from './request-headers.interceptor';

describe('provideCoreHttp', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideCoreHttp(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('leaves ordinary requests unchanged without an explicit context', () => {
    let result: { ok: boolean } | undefined;
    http.get<{ ok: boolean }>('/api/check').subscribe(response => { result = response; });
    const request = controller.expectOne('/api/check');
    expect(request.request.headers.has('X-Request-Source')).toBe(false);
    expect(request.request.headers.has('X-MFE')).toBe(false);
    request.flush({ ok: true });
    expect(result).toEqual({ ok: true });
  });

  it('adds selected custom headers to only the opted-in API call', () => {
    http.get('/api/mfe1/selected', {
      context: new HttpContext().set(REQUEST_CUSTOM_HEADERS, {
        'X-MFE': 'mfe1',
        'X-Feature': 'special',
      }),
    }).subscribe();
    http.get('/api/mfe1/ordinary').subscribe();
    http.get('/api/mfe2/ordinary').subscribe();

    const selected = controller.expectOne('/api/mfe1/selected');
    expect(selected.request.headers.get('X-MFE')).toBe('mfe1');
    expect(selected.request.headers.get('X-Feature')).toBe('special');

    for (const url of ['/api/mfe1/ordinary', '/api/mfe2/ordinary']) {
      const request = controller.expectOne(url);
      expect(request.request.headers.has('X-MFE')).toBe(false);
      expect(request.request.headers.has('X-Feature')).toBe(false);
      request.flush({});
    }
    selected.flush({});
  });

  it('preserves explicit request headers when context specifies the same name', () => {
    http.get('/api/priority', {
      headers: { 'X-MFE': 'caller' },
      context: new HttpContext().set(REQUEST_CUSTOM_HEADERS, { 'X-MFE': 'default' }),
    }).subscribe();
    const request = controller.expectOne('/api/priority');
    expect(request.request.headers.get('X-MFE')).toBe('caller');
    request.flush({});
  });

  it('also supports explicitly selected external APIs without changing unrelated ones', () => {
    http.get('https://example.com/selected', {
      context: new HttpContext().set(REQUEST_CUSTOM_HEADERS, { 'X-Feature': 'selected' }),
    }).subscribe();
    http.get('https://example.com/other').subscribe();
    const selected = controller.expectOne('https://example.com/selected');
    expect(selected.request.headers.get('X-Feature')).toBe('selected');
    selected.flush({});
    const other = controller.expectOne('https://example.com/other');
    expect(other.request.headers.has('X-Feature')).toBe(false);
    other.flush({});
  });
});

describe('provideCoreHttp additional interceptors', () => {
  it('runs an optional MFE-specific interceptor', () => {
    const mfeInterceptor: HttpInterceptorFn = (request, next) =>
      next(request.clone({ setHeaders: { 'X-MFE': 'mfe1' } }));
    TestBed.configureTestingModule({
      providers: [provideCoreHttp([mfeInterceptor]), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    http.get('/api/example').subscribe();
    const request = controller.expectOne('/api/example');
    expect(request.request.headers.get('X-MFE')).toBe('mfe1');
    request.flush({});
    controller.verify();
  });
});
