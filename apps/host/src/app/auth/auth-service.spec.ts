import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult, EventMessage, EventType } from '@azure/msal-browser';
import { of, throwError } from 'rxjs';
import { AUTH_CONFIG } from './auth-config';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  const account: AccountInfo = {
    homeAccountId: 'user.tenant',
    localAccountId: 'user',
    tenantId: 'tenant',
    environment: 'login.microsoftonline.com',
    username: 'user@example.com',
  };
  let active: AccountInfo | null;
  let accounts: AccountInfo[];
  let redirectResult: AuthenticationResult | null;
  let callback: ((event: EventMessage) => void) | undefined;
  const handleRedirectObservable = vi.fn();
  const loginRedirect = vi.fn();
  const logoutRedirect = vi.fn();
  const removeEventCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    active = null;
    accounts = [];
    redirectResult = null;
    callback = undefined;
    handleRedirectObservable.mockImplementation(() => of(redirectResult));
    loginRedirect.mockReturnValue(of(undefined));
    logoutRedirect.mockReturnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_CONFIG, useValue: { loginScopes: ['openid', 'profile'] } },
        {
          provide: MsalService,
          useValue: {
            handleRedirectObservable,
            loginRedirect,
            logoutRedirect,
            instance: {
              getAllAccounts: () => accounts,
              getActiveAccount: () => active,
              setActiveAccount: (value: AccountInfo | null) => {
                active = value;
              },
              addEventCallback: (value: (event: EventMessage) => void) => {
                callback = value;
                return 'callback-id';
              },
              removeEventCallback,
            },
          },
        },
      ],
    });
  });

  function emit(eventType: EventType): void {
    callback?.({
      eventType,
      interactionType: null,
      payload: null,
      error: null,
      timestamp: 0,
      correlationId: 'test',
    });
  }

  it('initializes once and restores a single cached account', async () => {
    accounts = [account];
    const auth = TestBed.inject(AuthService);
    await Promise.all([auth.initialize(), auth.initialize()]);
    expect(handleRedirectObservable).toHaveBeenCalledTimes(1);
    expect(auth.identity()).toEqual({ homeAccountId: 'user.tenant', tenantId: 'tenant' });
    expect(loginRedirect).not.toHaveBeenCalled();
  });

  it('does not select an arbitrary account when several are cached', async () => {
    accounts = [account, { ...account, homeAccountId: 'other.tenant' }];
    const auth = TestBed.inject(AuthService);
    await auth.initialize();
    expect(auth.signedIn()).toBe(false);
  });

  it('prefers the account returned by redirect processing', async () => {
    redirectResult = { account } as AuthenticationResult;
    const auth = TestBed.inject(AuthService);
    await auth.initialize();
    expect(auth.account()).toEqual(account);
  });

  it('updates identity synchronously on tenant switch and clears on logout', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.initialize();
    active = { ...account, tenantId: 'other-tenant' };
    emit(EventType.ACTIVE_ACCOUNT_CHANGED);
    expect(auth.identity()?.tenantId).toBe('other-tenant');
    emit(EventType.LOGOUT_START);
    expect(auth.identity()).toBeNull();
  });

  it('shares the root instance with a remote child injector', () => {
    const root = TestBed.inject(AuthService);
    const child = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    expect(child.get(AuthService)).toBe(root);
    child.destroy();
  });

  it('reports failed sign-in and releases the busy state', async () => {
    loginRedirect.mockReturnValue(throwError(() => new Error('failed')));
    const auth = TestBed.inject(AuthService);
    await auth.signIn();
    expect(loginRedirect).toHaveBeenCalledWith({
      scopes: ['openid', 'profile'],
      prompt: 'select_account',
    });
    expect(auth.error()).toContain('Sign-in could not');
    expect(auth.busy()).toBe(false);
  });

  it('logs out the active account and removes its listener on destruction', async () => {
    active = account;
    const auth = TestBed.inject(AuthService);
    await auth.signOut();
    expect(logoutRedirect).toHaveBeenCalledWith({ account });
    TestBed.resetTestingModule();
    expect(removeEventCallback).toHaveBeenCalledWith('callback-id');
  });
});
