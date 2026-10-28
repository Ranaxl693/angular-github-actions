import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, EventType } from '@azure/msal-browser';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG } from './auth-config';

@Service()
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly config = inject(AUTH_CONFIG);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activeAccount = signal<AccountInfo | null>(null);
  private readonly pending = signal(false);
  private readonly failure = signal<string | null>(null);
  private initialization?: Promise<void>;

  readonly account = this.activeAccount.asReadonly();
  readonly busy = this.pending.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly signedIn = computed(() => this.account() !== null);
  readonly identity = computed(() => {
    const account = this.account();
    return account ? { homeAccountId: account.homeAccountId, tenantId: account.tenantId } : null;
  });

  initialize(): Promise<void> {
    return (this.initialization ??= this.initializeMsal());
  }

  private async initializeMsal(): Promise<void> {
    // This API awaits MSAL initialization before processing the redirect result.
    const result = await firstValueFrom(this.msal.handleRedirectObservable());
    const instance = this.msal.instance;
    const accounts = instance.getAllAccounts();
    const account =
      result?.account ??
      instance.getActiveAccount() ??
      (accounts.length === 1 ? accounts[0] : null);
    instance.setActiveAccount(account);
    this.activeAccount.set(account);

    const callbackId = instance.addEventCallback((event) => {
      if (event.eventType === EventType.ACTIVE_ACCOUNT_CHANGED) {
        this.activeAccount.set(instance.getActiveAccount());
      }
      if (event.eventType === EventType.LOGOUT_START) {
        this.activeAccount.set(null);
      }
    });
    this.destroyRef.onDestroy(() => {
      if (callbackId) instance.removeEventCallback(callbackId);
    });
  }

  async signIn(): Promise<void> {
    if (this.busy()) return;
    this.pending.set(true);
    this.failure.set(null);
    try {
      await this.initialize();
      await firstValueFrom(
        this.msal.loginRedirect({
          scopes: [...this.config.loginScopes],
          prompt: 'select_account',
        }),
      );
    } catch {
      this.failure.set('Sign-in could not be completed. Please try again.');
    } finally {
      this.pending.set(false);
    }
  }

  async signOut(): Promise<void> {
    if (this.busy()) return;
    this.pending.set(true);
    this.failure.set(null);
    try {
      await this.initialize();
      await firstValueFrom(this.msal.logoutRedirect({ account: this.account() }));
    } catch {
      this.activeAccount.set(this.msal.instance.getActiveAccount());
      this.failure.set('Sign-out could not be completed. Please try again.');
    } finally {
      this.pending.set(false);
    }
  }
}
