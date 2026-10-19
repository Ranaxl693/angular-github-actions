import { appendFile, cp, lstat, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// Consume the project list already printed by Nx; no prior-run outputs or comparisons.
const projects = JSON.parse(await readFile(process.argv[2], 'utf8'));
if (!Array.isArray(projects) || projects.some((project) => typeof project !== 'string')) {
  throw new Error('Expected a JSON array of affected project names.');
}
const applications = {
  host: ['dist/angular-github-actions/browser', 'index.html'],
  mfe1: ['dist/apps/mfe1/browser', 'remoteEntry.json'],
  mfe2: ['dist/apps/mfe2/browser', 'remoteEntry.json'],
};
const selected = Object.keys(applications).filter((app) => projects.includes(app));
const stage = resolve('dist/affected-pages');
await rm(stage, { recursive: true, force: true });

async function validateDirectory(path) {
  if (!(await lstat(path)).isDirectory()) throw new Error(`Invalid build directory: ${path}`);
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await validateDirectory(child);
    else if (!entry.isFile()) throw new Error(`Build output must contain only files: ${child}`);
  }
}

for (const app of selected) {
  const [source, requiredFile] = applications[app];
  await validateDirectory(source);
  const required = await lstat(join(source, requiredFile));
  if (!required.isFile() || required.size === 0) throw new Error(`Missing build output for ${app}`);
  await mkdir(stage, { recursive: true });
  await cp(source, join(stage, app), { recursive: true });
}
console.log(`Applications packaged from this run: ${selected.join(', ') || 'none; deployment skipped'}`);
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `has-apps=${selected.length > 0}\n`);
}
