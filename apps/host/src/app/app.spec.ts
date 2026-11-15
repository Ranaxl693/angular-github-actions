import { provideApi } from '@workspace/lib-core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';

describe('App', () => {
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
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should display the configured environment', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="environment-name"]')?.textContent?.trim()).toBe(
      `Environment: ${environment.environmentName}`,
    );
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, angular-github-actions');
  });
});
