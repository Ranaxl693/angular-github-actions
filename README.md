# angular-github-actions
Test Github Action

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.3.

## Prerequisites

Use Node.js 24.18.0 (pinned in `.nvmrc`). With nvm, run `nvm install` and `nvm use`. Install dependencies with `npm ci`.

## Development server

To start a local development server, run:

```bash
npm ci
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Pull request CI

`.github/workflows/angular-ci.yml` checks pull requests targeting `develop` on
`opened`, `synchronize` (new commits), `reopened`, and `ready_for_review` events.
It has no push trigger, environment selection, or deployment step.

Three independent jobs run in parallel:

| Job/check name | Command | Purpose |
| --- | --- | --- |
| Type Check | `npm run typecheck` | Check `tsconfig.app.json` without emitting files |
| Lint | `npm run lint` | Check TypeScript and Angular templates with ESLint |
| Unit Tests | `npm run test:ci` | Run the existing Vitest suite once, without watching |

**Angular Build** depends on all three jobs using
`needs: [type-check, lint, unit-tests]`. It runs `npm run build` only when every
validation job succeeds. A failed or skipped validation prevents the build;
a failed build fails the workflow. Each job reports its own status in GitHub.
A validation failure does not cancel the other independent validation jobs.

Every job checks out the repository, loads Node from `.nvmrc`, enables npm's
download cache, and runs `npm ci` on its own runner. The cache speeds up downloads;
it does not share `node_modules` between runners. Repository contents are
read-only for the workflow token. A newer run for the same pull request cancels
the older run to avoid redundant checks.

`eslint.config.cjs` applies the recommended ESLint, TypeScript, Angular TypeScript,
Angular template, and template accessibility rules. Both external templates and
inline component templates are checked. Generated output is ignored. Warnings
also fail `npm run lint`; no checks are bypassed to make CI pass.

### Run the checks locally

```bash
nvm use
npm ci
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

The checks can be run independently. The build uses the existing default Angular
configuration (`production`); existing local environment configurations remain
available in `angular.json` but are not selected by CI.

### Verify in GitHub

Push the `feature/github-actions` branch and open a PR targeting `develop`.
In the PR's Checks tab or **Actions → Angular CLI CI**, confirm that **Type Check**,
**Lint**, and **Unit Tests** start independently, then **Angular Build** starts
only after all three pass. Push another commit to rerun the checks. A validation
failure should leave **Angular Build** skipped. No merge or deployment is performed.

If branch protection requires the old combined check name, update that rule to
require the new check names so the PR is evaluated against the current workflow.
