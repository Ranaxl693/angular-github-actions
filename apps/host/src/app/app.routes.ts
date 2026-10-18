import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';
import type { NativeFederationResult } from '@angular-architects/native-federation';

interface RemoteComponent {
  App: Type<unknown>;
}

export function routes(federation: NativeFederationResult): Routes {
  return ['mfe1', 'mfe2'].map((remote) => ({
    path: remote,
    loadComponent: () =>
      federation
        .loadRemoteModule(remote, './Component')
        .then((module) => (module as RemoteComponent).App),
  }));
}
