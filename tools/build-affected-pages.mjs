import {
  appendFile,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const applications = {
  host: {
    output: 'dist/angular-github-actions',
    requiredFile: 'browser/index.html',
  },
  mfe1: {
    output: 'dist/apps/mfe1',
    requiredFile: 'browser/remoteEntry.json',
  },
  mfe2: {
    output: 'dist/apps/mfe2',
    requiredFile: 'browser/remoteEntry.json',
  },
};
const appNames = Object.keys(applications);
const artifactDir = resolve('previous-app-builds');
const artifactStage = resolve('dist/nx-pages-app-builds');
const buildBase = 'origin/develop';
const currentHead = process.env.PR_HEAD_SHA;

if (!/^[0-9a-f]{40}$/i.test(currentHead || '')) {
  throw new Error('PR_HEAD_SHA must be set to the pull request head commit SHA.');
}

function nx(args) {
  const result = spawnSync('npx', ['nx', ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Nx command failed: npx nx ${args.join(' ')}\n${result.stderr || result.stdout || ''}`,
    );
  }
  return result.stdout?.trim() ?? '';
}

function runNodeScript(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Node script failed with exit code ${result.status}: ${scriptPath}`);
  }
}

function affectedProjects(base, head = currentHead) {
  const output = nx([
    'show',
    'projects',
    '--affected',
    `--base=${base}`,
    `--head=${head}`,
    '--json',
  ]);
  const projects = JSON.parse(output);
  if (!Array.isArray(projects) || projects.some((project) => typeof project !== 'string')) {
    throw new Error(`Nx returned an invalid affected-project list for base ${base}`);
  }
  return projects;
}

async function isValidAppOutput(directory, requiredFile) {
  try {
    const outputRoot = resolve(directory);
    const outputRootInfo = await lstat(outputRoot);
    if (!outputRootInfo.isDirectory()) return false;
    const required = await lstat(join(outputRoot, requiredFile));
    if (!required.isFile() || required.size === 0) return false;
    const inspect = async (path) => {
      const entries = await readdir(path, { withFileTypes: true });
      for (const entry of entries) {
        const child = join(path, entry.name);
        const info = await lstat(child);
        if (info.isSymbolicLink()) return false;
        if (info.isDirectory() && !(await inspect(child))) return false;
        if (!info.isDirectory() && !info.isFile()) return false;
      }
      return true;
    };
    return inspect(outputRoot);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

async function restoreAppOutput(app, source) {
  const destination = resolve(applications[app].output);
  await rm(destination, { recursive: true, force: true });
  await mkdir(resolve(destination, '..'), { recursive: true });
  await cp(source, destination, { recursive: true });
}

async function writeStepSummary(summary) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  const lines = [
    '### Pages build plan',
    '',
    `- Projects affected from \`${buildBase}\`: ${summary.affectedProjects.join(', ') || 'none'}`,
    `- Applications built: ${summary.builtApps.join(', ') || 'none'}`,
    `- Applications restored: ${summary.restoredApps.join(', ') || 'none'}`,
    `- Applications skipped (restored unchanged output): ${summary.skippedApps.join(', ') || 'none'}`,
    `- Nx build tasks executed: ${summary.taskCount}`,
  ];
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

const affectedFromDevelop = affectedProjects(buildBase);
console.log(`Projects affected from ${buildBase}: ${affectedFromDevelop.join(', ') || 'none'}`);

let artifactMetadata;
try {
  artifactMetadata = JSON.parse(await readFile(join(artifactDir, 'build-metadata.json'), 'utf8'));
  if (
    artifactMetadata.schemaVersion !== 1 ||
    typeof artifactMetadata.commitSha !== 'string' ||
    !/^[0-9a-f]{40}$/i.test(artifactMetadata.commitSha) ||
    artifactMetadata.configuration !== 'pages' ||
    !Array.isArray(artifactMetadata.projects) ||
    appNames.some((app) => !artifactMetadata.projects.includes(app))
  ) {
    artifactMetadata = undefined;
  }
} catch (error) {
  if (error.code === 'ENOENT' || error instanceof SyntaxError) {
    artifactMetadata = undefined;
  } else {
    throw error;
  }
}

const restoredApps = [];
const skippedApps = [];
let buildApps;
let affectedSinceArtifact = [];
let artifactComparisonAvailable = false;

if (artifactMetadata) {
  try {
    const artifactHead = process.env.PREVIOUS_APP_BUILDS_HEAD_SHA || artifactMetadata.commitSha;
    if (!/^[0-9a-f]{40}$/i.test(artifactHead)) {
      throw new Error('Previous artifact has no valid source commit SHA.');
    }
    affectedSinceArtifact = affectedProjects(artifactHead);
    artifactComparisonAvailable = true;
    console.log(
      `Projects affected since validated artifact ${artifactHead}: ${affectedSinceArtifact.join(', ') || 'none'}`,
    );
  } catch (error) {
    console.warn(
      `Could not safely compare with the prior artifact; rebuilding all apps. ${error.message}`,
    );
    buildApps = [...appNames];
  }
  if (artifactComparisonAvailable) {
    buildApps = [];
    for (const app of appNames) {
      const priorOutput = join(artifactDir, app);
      const validPriorOutput = await isValidAppOutput(priorOutput, applications[app].requiredFile);
      if (!affectedSinceArtifact.includes(app) && validPriorOutput) {
        await restoreAppOutput(app, priorOutput);
        restoredApps.push(app);
        skippedApps.push(app);
        console.log(`Restored ${app} output from ${join(artifactDir, app)}.`);
      } else {
        buildApps.push(app);
      }
    }
  }
} else {
  console.log(
    'No compatible successful PR artifact found; building all apps to ensure complete outputs.',
  );
  buildApps = [...appNames];
}

for (const app of buildApps) {
  const reason =
    !artifactComparisonAvailable && artifactMetadata
      ? 'artifact comparison unavailable; rebuilding safely'
      : artifactComparisonAvailable && affectedSinceArtifact.includes(app)
        ? 'affected since the validated artifact'
        : 'output missing or unavailable';
  console.log(`Building ${app}: ${reason}`);
}
for (const app of skippedApps) {
  console.log(`Skipping ${app} build: unchanged output restored from the validated artifact.`);
}
console.log(`Applications selected for Pages build: ${buildApps.join(', ') || 'none'}`);

let taskCount = 0;
let cacheHitCount = 0;
if (buildApps.length > 0) {
  const graphDir = await mkdtemp(join(tmpdir(), 'nx-pages-build-'));
  const graphPath = join(graphDir, 'task-graph.json');
  try {
    nx([
      'run-many',
      '-t',
      'build',
      `--projects=${buildApps.join(',')}`,
      '--configuration=pages',
      `--graph=${graphPath}`,
    ]);
    const graph = JSON.parse(await readFile(graphPath, 'utf8'));
    taskCount = Object.keys(graph.tasks?.tasks ?? {}).length;
    if (taskCount === 0) {
      throw new Error('Nx produced an empty build task graph.');
    }
    console.log(`Total Nx build tasks to execute, including dependencies: ${taskCount}`);
    const result = spawnSync(
      'npx',
      [
        'nx',
        'run-many',
        '-t',
        'build',
        `--projects=${buildApps.join(',')}`,
        '--configuration=pages',
        '--outputStyle=static',
      ],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    );
    if (result.error) throw result.error;
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    if (result.status !== 0) {
      throw new Error(`Nx build failed with exit code ${result.status}.`);
    }
    const cacheSummary = result.stdout.match(
      /Nx read the output from the cache instead of running the command for (\d+) out of (\d+) tasks\./,
    );
    if (cacheSummary) {
      cacheHitCount = Number(cacheSummary[1]);
      if (Number(cacheSummary[2]) !== taskCount) {
        throw new Error(
          `Nx task graph count (${taskCount}) did not match its execution summary (${cacheSummary[2]}).`,
        );
      }
    }
  } finally {
    await rm(graphDir, { recursive: true, force: true });
  }
} else {
  console.log('No application build targets are needed; all unchanged outputs were restored.');
}

await rm(artifactStage, { recursive: true, force: true });
await mkdir(artifactStage, { recursive: true });
for (const app of appNames) {
  const source = resolve(applications[app].output);
  if (!(await isValidAppOutput(source, applications[app].requiredFile))) {
    throw new Error(
      `Required Pages output for ${app} is missing: ${join(source, applications[app].requiredFile)}`,
    );
  }
  await cp(source, join(artifactStage, app), { recursive: true });
}
await writeFile(
  join(artifactStage, 'build-metadata.json'),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      commitSha: currentHead,
      configuration: 'pages',
      projects: appNames,
    },
    null,
    2,
  )}\n`,
);

runNodeScript('tools/package-pages.mjs');
const executedTaskCount = taskCount - cacheHitCount;
console.log(
  `Total Nx build tasks executed: ${executedTaskCount} (${taskCount} scheduled; ${cacheHitCount} restored from local Nx cache).`,
);

await writeStepSummary({
  affectedProjects: affectedFromDevelop,
  builtApps: buildApps,
  restoredApps,
  skippedApps,
  taskCount: executedTaskCount,
});
