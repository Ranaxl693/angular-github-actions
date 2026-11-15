import { TestBed } from '@angular/core/testing';
import {
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiClient } from './api-client';
import { provideApi } from './provide-api';

const testInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ setHeaders: { 'X-Test': 'shared' } }));

describe('ApiClient', () => {
  let api: ApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApi({ baseUrl: 'https://api.example.test/v1/' }, [testInterceptor]),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(ApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('joins endpoints and forwards query parameters, headers, context and credentials', () => {
    const flag = new HttpContextToken(() => false);
    let result: { id: number }[] | undefined;
    api
      .get<{ id: number }[]>('/products', {
        params: { page: 2, active: true },
        headers: { 'X-Feature': 'products' },
        context: new HttpContext().set(flag, true),
        withCredentials: true,
      })
      .subscribe((value) => (result = value));

    const request = http.expectOne('https://api.example.test/v1/products?page=2&active=true');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Feature')).toBe('products');
    expect(request.request.headers.get('X-Test')).toBe('shared');
    expect(request.request.context.get(flag)).toBe(true);
    expect(request.request.withCredentials).toBe(true);
    request.flush([{ id: 1 }]);
    expect(result).toEqual([{ id: 1 }]);
  });

  for (const method of ['post', 'put', 'patch'] as const) {
    it(`sends ${method.toUpperCase()} bodies and returns the response`, () => {
      const body = { name: 'Angular' };
      let result: { id: number } | undefined;
      api[method]<{ id: number }>('products', body).subscribe((value) => (result = value));
      const request = http.expectOne('https://api.example.test/v1/products');
      expect(request.request.method).toBe(method.toUpperCase());
      expect(request.request.body).toEqual(body);
      request.flush({ id: 1 });
      expect(result).toEqual({ id: 1 });
    });
  }

  it('supports DELETE with an empty response', () => {
    let completed = false;
    api.delete<void>('products/1').subscribe({ complete: () => (completed = true) });
    const request = http.expectOne('https://api.example.test/v1/products/1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });

  it('preserves backend errors and does not retry mutations', () => {
    let error: HttpErrorResponse | undefined;
    api.post('products', {}).subscribe({ error: (value) => (error = value) });
    http
      .expectOne('https://api.example.test/v1/products')
      .flush({ message: 'Invalid product' }, { status: 422, statusText: 'Unprocessable Entity' });
    expect(error?.status).toBe(422);
    expect(error?.error).toEqual({ message: 'Invalid product' });
    http.expectNone('https://api.example.test/v1/products');
  });

  it('rejects absolute and protocol-relative endpoints', () => {
    for (const path of ['https://other.test/products', '//other.test/products', '\\other.test']) {
      expect(() => api.get(path)).toThrowError('ApiClient expects an API-relative endpoint.');
    }
  });

  it('rejects empty API configuration', () => {
    expect(() => provideApi({ baseUrl: ' ' })).toThrowError('API baseUrl must not be empty.');
  });

  it('supports same-origin API paths', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideApi({ baseUrl: '/api/' }), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiClient);
    http = TestBed.inject(HttpTestingController);
    api.get('products').subscribe();
    http.expectOne('/api/products').flush([]);
  });
});
