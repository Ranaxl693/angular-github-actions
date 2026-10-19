# Angular Native Federation monorepo

Angular 22.2 applications orchestrated by Nx 23, with Native Federation 22.2.
The original Angular app is now the host in `apps/host`.

## Workspace layout

```text
apps/
  host/       Host, navigation, runtime federation manifest (port 4200)
  mfe1/       Products micro frontend (port 4201)
  mfe2/       Selection micro frontend (port 4202)
libs/
  lib-core/   Shared WorkspaceState service
  lib-ui/     Reusable standalone Card component
  .../project.json    Each library and app owns its Nx targets
tools/
  federation.config.mjs   Common singleton/dependency-sharing configuration
  package-pages.mjs       Assemble the host and both remote builds
  preview-pages.mjs       Local static preview under a Pages-style subfolder
e2e/                     Playwright federation smoke tests
```

All five projects have their own Nx build, typecheck, lint and test targets.
Angular CLI's modern application builder and the existing Vitest setup are retained.
Nx invokes the Angular builders through `nx:run-commands`, schedules dependencies,
and caches successful tasks. No Nx Cloud account is required.

## Start all applications

Use Node.js **24.18.0**, pinned in `.nvmrc`:

```bash
nvm install
nvm use
npm ci
npm start
```

Open **http://localhost:4200**. The same command starts both remotes too:

| Application | Standalone URL        | Host route |
| ----------- | --------------------- | ---------- |
| Host        | http://localhost:4200 | `/`        |
| MFE 1       | http://localhost:4201 | `/mfe1`    |
| MFE 2       | http://localhost:4202 | `/mfe2`    |

To start them in separate terminals, use `npm run start:host`,
`npm run start:mfe1`, and `npm run start:mfe2`.

Select **MFE 1 · Products** and add an item. The host's counter updates.
Switch to **MFE 2 · Selection** to see the same count, then clear it.
State is shared within a host page and resets on refresh. Separately opened
standalone app pages have their own injectors and state.

## How Native Federation is connected

Each app has a `federation.config.mjs` and `tsconfig.federation.json`.
The remotes expose their standalone root component as `./Component`.
The host reads `apps/host/public/federation.manifest.json`, initializes the
federation runtime **before** importing Angular's `bootstrap.ts`, and passes
that runtime explicitly into its lazy route configuration.

The host does not import the remotes' source code. At runtime it loads their
`remoteEntry.json` manifests and exposed JavaScript modules. Angular, RxJS,
`@workspace/lib-core`, and `@workspace/lib-ui` are shared. The workspace library
aliases are defined in root `tsconfig.json`, and shared mappings are configured
as singletons so the host and remote components use the same service identity.

`lib-core` exports `WorkspaceState`; `lib-ui` exports `Card`.
Import them through their public APIs:

```typescript
import { WorkspaceState } from '@workspace/lib-core';
import { Card } from '@workspace/lib-ui';
```

Library builds use Angular's compiler with partial compilation. They are internal
workspace libraries; publishing npm packages is not configured. Their federation
mapping version is `1.0.0` in `tools/federation.config.mjs`; change that version
consistently across deployments if the shared APIs become incompatible.

## Nx commands

```bash
npm run typecheck       # All five projects, without emitting files
npm run lint            # TypeScript, external and inline Angular templates
npm run test:ci         # All five Vitest suites, no watch mode
npm run build           # Build libraries, then all three production apps
npm run graph           # Interactive Nx project graph
npx nx build mfe1        # Build one remote and its library dependencies
npx nx test lib-core     # Test one library
npx nx affected -t lint,test,build --base=origin/develop
```

Nx caches builds, type checks, linting and tests in `.nx/cache` and invalidates
consumers when library inputs change. `host`, `mfe1`, and `mfe2` explicitly depend
on both libraries in their project configuration. A second unchanged build should
report cache hits. Serve targets are continuous and are not cached.

Production outputs are `dist/angular-github-actions/browser` for the host and
`dist/apps/mfe1/browser`, `dist/apps/mfe2/browser` for the remotes.
Development builds use `dist/dev/<app>` so live dev servers do not overwrite
production artifacts.

The host's existing `development`, `cit`, `dev` and `production` Angular
configurations remain in `angular.json`. Use an explicit project with Angular
CLI commands, for example `npx ng build host --configuration=cit`.

## GitHub Pages bundle and browser tests

```bash
npm run build:pages
npx playwright install chromium
npm run e2e
```

`build:pages` builds all three apps with `baseHref: './'`, then places the remotes
under the host output and writes a same-origin runtime manifest:

```text
dist/angular-github-actions/browser/
  index.html
  remoteEntry.json
  federation.manifest.json
  remotes/
    mfe1/remoteEntry.json
    mfe2/remoteEntry.json
```

`npm run e2e` starts a static preview automatically at
`http://127.0.0.1:4400/angular-github-actions/cit/`. It tests both remotes, shared
state across remote navigation, route refresh, and standalone remote launches.
The test uses a real subfolder to catch base-path regressions.

If Google Chrome is already installed, `PLAYWRIGHT_CHANNEL=chrome npm run e2e`
can use it instead of downloading Chromium.

For an interactive preview, run `npm run preview:pages` after building.
Host routes use normal paths without a hash. The Pages packaging step creates
`mfe1/index.html` and `mfe2/index.html` with a parent-relative base path so direct
links and refreshes also work on static hosting. Add matching route entry files
when introducing new host routes.
The relative manifest and asset paths work inside the existing environment folders.
Environment folder selection does not rebuild or change the runtime manifest.
To deploy remotes separately later, replace their URLs in the deployed
`federation.manifest.json` and configure CORS on the remote servers.

## Existing GitHub Actions integration

`.github/workflows/angular-ci.yml` keeps the current PR triggers, check ordering,
artifact names, deployment jobs and environment settings. The existing npm
commands now check all five projects through Nx. Nx caching is local to each
runner; shared remote caching is not configured. Existing npm download caching
is retained. The build job compiles all apps, installs Chromium and
runs the federation browser tests before uploading the artifact.

The Pages artifact path remains `dist/angular-github-actions/browser`, so existing
folder deployment steps copy the host **and both remotes** together. No additional
workflow, deployment provider, or approval rule is introduced by this migration.

The `.github/workflows/nx-multi-runner-ci.yml` runners compare the PR event's base
SHA with its checked-out merge SHA (`github.sha`). Both references are fixed for
the run. Each runner logs the expanded command and affected project names:

```bash
npx nx show projects --affected --base="$NX_BASE" --head="$NX_HEAD" --json
```

Typecheck, lint, test and build use `nx affected` with that same pair. Build runs
with `--configuration=pages` and normal Nx local caching; there is no prior-run artifact lookup,
download, commit comparison or application-output reuse in the build job.
`tools/package-affected-pages.mjs` packages only applications in the printed Nx
list. If no applications are affected, publishing and deployment are skipped.
The staging and validated artifacts only transfer **this run's** outputs between
runners; they are not a cache.

Deployments replace affected applications in the selected environment and retain
its other applications from the existing `gh-pages` site. Host updates recreate
the clean-route entry pages and relative federation manifest. A new environment
needs a complete host + mfe1 + mfe2 deployment first; an incomplete first deployment
fails instead of publishing a broken site.
