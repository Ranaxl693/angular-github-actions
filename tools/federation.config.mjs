import {
  fromPackageJson,
  mappingsFromWorkspace,
  withNativeFederation,
} from '@angular-architects/native-federation/config';

export function federationConfig(name, exposes, uiMappings = []) {
  return withNativeFederation({
    name,
    exposes,
    shared: fromPackageJson({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
      build: 'package',
    }).patch(['@angular/core'], { includeSecondaries: { keepAll: true } }),
    sharedMappings: mappingsFromWorkspace({
      singleton: true,
      strictVersion: true,
      version: '1.0.0',
      requiredVersion: '1.0.0',
    }).filter(['@workspace/lib-core', '@workspace/lib-state', ...uiMappings]),
    skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket'],
    features: { denseChunking: true },
  });
}
