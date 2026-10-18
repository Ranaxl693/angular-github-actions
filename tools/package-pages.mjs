import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const host = resolve('dist/angular-github-actions/browser');
const manifest = {};
const index = await readFile(`${host}/index.html`, 'utf8');
// Pages serves these real route directories on refresh without requiring hash URLs.
for (const route of ['mfe1', 'mfe2']) {
  await mkdir(`${host}/${route}`, { recursive: true });
  await writeFile(
    `${host}/${route}/index.html`,
    index.replace('<base href="./">', '<base href="../">'),
  );
}
for (const remote of ['mfe1', 'mfe2']) {
  const source = resolve(`dist/apps/${remote}/browser`);
  await readFile(`${source}/remoteEntry.json`);
  await mkdir(`${host}/remotes`, { recursive: true });
  await cp(source, `${host}/remotes/${remote}`, { recursive: true, force: true });
  manifest[remote] = `./remotes/${remote}/remoteEntry.json`;
}
await writeFile(`${host}/federation.manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log('Packaged host, mfe1 and mfe2 for a relative-path Pages deployment.');
