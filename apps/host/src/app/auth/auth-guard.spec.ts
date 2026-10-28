import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from './auth-service';

@Component({ template: '' })
class ProtectedPage {}

describe('authGuard', () => {
  const signedIn = signal(false);
  const initialize = vi.fn<() => Promise<void>>();
  const signIn = vi.fn<() => Promise<void>>();
  const loadComponent = vi.fn(async () => ProtectedPage);

  beforeEach(() => {
    vi.clearAllMocks();
    signedIn.set(false);
    initialize.mockResolvedValue(undefined);
    signIn.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { initialize, signedIn, signIn } },
        provideRouter([
          {
            path: '',
            canActivate: [authGuard],
            canActivateChild: [authGuard],
            children: [
              { path: '', pathMatch: 'full', component: ProtectedPage },
              { path: 'remote', loadComponent },
            ],
          },
        ]),
      ],
    });
  });

  it('redirects an unauthenticated home visit and cancels navigation', async () => {
    expect(await TestBed.inject(Router).navigateByUrl('/')).toBe(false);
    expect(initialize).toHaveBeenCalled();
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('does not load a remote component before authentication', async () => {
    expect(await TestBed.inject(Router).navigateByUrl('/remote')).toBe(false);
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(loadComponent).not.toHaveBeenCalled();
  });

  it('allows signed-in navigation between home and remote without login', async () => {
    signedIn.set(true);
    const router = TestBed.inject(Router);
    expect(await router.navigateByUrl('/')).toBe(true);
    expect(await router.navigateByUrl('/remote')).toBe(true);
    expect(loadComponent).toHaveBeenCalledTimes(1);
    expect(signIn).not.toHaveBeenCalled();
  });

  it('waits for redirect processing before deciding whether to sign in', async () => {
    initialize.mockImplementation(async () => {
      signedIn.set(true);
    });
    expect(await TestBed.inject(Router).navigateByUrl('/')).toBe(true);
    expect(signIn).not.toHaveBeenCalled();
  });
});
