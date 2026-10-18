import { initFederation } from '@angular-architects/native-federation';

initFederation('federation.manifest.json')
  .then((federation) => import('./bootstrap').then(({ bootstrap }) => bootstrap(federation)))
  .catch((error: unknown) => console.error('Federation bootstrap failed', error));
