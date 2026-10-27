import { initFederation } from '@angular-architects/native-federation';

async function start() {
  performance.mark('startup:start');

  const federation = await initFederation('federation.manifest.json');
  performance.mark('federation:ready');

  const { bootstrap } = await import('./bootstrap');
  performance.mark('bootstrap-module:ready');

  await bootstrap(federation);
  performance.mark('angular:ready');

  const stages = [
    ['Federation initialization', 'startup:start', 'federation:ready'],
    ['Bootstrap module import', 'federation:ready', 'bootstrap-module:ready'],
    ['Angular bootstrap', 'bootstrap-module:ready', 'angular:ready'],
    ['Startup from main.ts', 'startup:start', 'angular:ready'],
  ] as const;

  const timings = stages.map(([name, startMark, endMark]) => {
    const entry = performance.measure(name, startMark, endMark);
    return { stage: entry.name, milliseconds: Math.round(entry.duration) };
  });

  console.table(timings);
  // A serialized copy makes the same measurements readable in captured browser logs.
  console.info('Host startup timings (ms):', JSON.stringify(timings));
}

start().catch((error: unknown) => console.error('Application startup failed', error));
