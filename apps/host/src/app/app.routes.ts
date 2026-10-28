import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';
import type { NativeFederationResult } from '@angular-architects/native-federation';
import { authGuard } from './auth/auth-guard';

interface RemoteComponent {
  App: Type<unknown>;
}

export function routes(federation: NativeFederationResult): Routes {
  const remotes: Routes = ['mfe1', 'mfe2'].map((remote) => ({
    path: remote,
    loadComponent: () =>
      federation
        .loadRemoteModule(remote, './Component')
        .then((module) => (module as RemoteComponent).App),
  }));
  return [
    {
      path: '',
      canActivate: [authGuard],
      canActivateChild: [authGuard],
      children: [
        { path: '', pathMatch: 'full', children: [] },
        ...remotes,
        { path: '**', redirectTo: '' },
      ],
    },
  ];
}
