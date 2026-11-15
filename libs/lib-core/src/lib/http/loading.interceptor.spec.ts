import { HttpClient, HttpContext } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideCoreHttp } from './provide-core-http';
import { LoadingService } from './loading.service';
import { SHOW_GLOBAL_LOADER } from './loading.interceptor';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let loading: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideCoreHttp(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(LoadingService);
  });

  afterEach(() => controller.verify());

  it('tracks parallel HTTP requests until all are complete', () => {
    expect(loading.isLoading()).toBe(false);
    http.get('/api/one').subscribe();
    http.get('/api/two').subscribe();

    expect(loading.activeCount()).toBe(2);
    expect(loading.isLoading()).toBe(true);

    controller.expectOne('/api/one').flush({});
    expect(loading.activeCount()).toBe(1);
    expect(loading.isLoading()).toBe(true);

    controller.expectOne('/api/two').flush({});
    expect(loading.activeCount()).toBe(0);
    expect(loading.isLoading()).toBe(false);
  });

  it('stops tracking on HTTP error', () => {
    http.get('/api/failure').subscribe({ error: () => undefined });
    controller.expectOne('/api/failure').flush(
      { message: 'failed' },
      { status: 500, statusText: 'Server Error' },
    );
    expect(loading.isLoading()).toBe(false);
  });

  it('stops tracking when the request is cancelled', () => {
    const subscription = http.get('/api/slow').subscribe();
    expect(loading.isLoading()).toBe(true);
    subscription.unsubscribe();
    expect(loading.activeCount()).toBe(0);
  });

  it('allows callers to opt out of global loading', () => {
    http.get('/api/background', {
      context: new HttpContext().set(SHOW_GLOBAL_LOADER, false),
    }).subscribe();

    expect(loading.isLoading()).toBe(false);
    controller.expectOne('/api/background').flush({});
    expect(loading.isLoading()).toBe(false);
  });
});
