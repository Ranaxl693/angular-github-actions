import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .then(() => import('./bootstrap'))
  .catch((error: unknown) => console.error('Federation bootstrap failed', error));
