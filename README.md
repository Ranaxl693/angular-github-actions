# angular-github-actions
Test Github Action

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.3.

## Prerequisites

Use Node.js 24.18.0 (pinned in `.nvmrc`). With nvm, run `nvm install` and `nvm use`. Install dependencies with `npm ci`.

## Development server

To start a local development server, run:

```bash
npm i
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

## Environment-based CI builds

This example selects an Angular build environment. It does not deploy anything,
use hosting services, or require credentials or GitHub deployment environments.
The selected name is compiled into the app and displayed below the greeting.
Changing it requires rebuilding the app.

| Selection | Angular build configuration | Displayed environment |
| --- | --- | --- |
| CIT (default for PRs and manual runs) | `cit` | CIT |
| DEV | `dev` | DEV |
| PRODUCTION | `production` | PRODUCTION |

`src/environments/environment.ts` is the CIT configuration. Angular replaces
this import with `environment.dev.ts` or `environment.production.ts` for the
corresponding build. CIT and DEV enable source maps and disable optimization;
PRODUCTION keeps the existing optimized build and size budgets.
The existing `development` configuration uses DEV, so `npm start` displays DEV.
The existing default `npm run build` still builds PRODUCTION.

### Workflow behavior

The single `validate` job runs these steps in order:

1. Select the environment and print it to the logs and job summary.
2. Check out the code and set up the Node version in `.nvmrc`.
3. Run `npm ci` once. All remaining commands reuse the same `node_modules`.
4. Run TypeScript checking.
5. Run unit tests once (`--watch=false`).
6. Build the selected Angular configuration.

A failing command fails its step and job. GitHub skips the remaining steps:
type-check failure skips tests and build; test failure skips build; build failure
fails the workflow. There is no `continue-on-error` or deployment step.

PRs targeting `develop`, including `feature/* -> develop`, automatically use CIT.
The existing PR activity types are preserved, and PRs from other source branches
are still checked. No environment input is needed for PRs. Manual runs use the
selected dropdown value. Runs for different environment selections do not cancel
each other; a newer run for the same workflow/ref/environment cancels the older one.

### Test from the GitHub Actions UI

1. Push these changes to GitHub. The workflow with `workflow_dispatch` must be
   present on the repository's **default branch** for the **Run workflow** button
   to be available. The branch you select to run must also contain these changes.
2. Open `Ranaxl693/angular-github-actions` and select **Actions → Angular CLI CI**.
3. Click **Run workflow**, choose the branch, and select **CIT**, **DEV**, or
   **PRODUCTION** in the environment dropdown. CIT is preselected.
4. Click **Run workflow** and open the new run.
5. In **Type Check, Test and Build**, inspect **Select environment** for
   `Selected Environment: CIT` (or the selected name). Inspect **Angular build**
   for `Running Angular Build for CIT` and the selected configuration.
6. Open the run's **Summary** page to see the selected environment and configuration.
7. Repeat for the other two environments.

To test the automatic path, open a `feature/*` PR targeting `develop`, or push
another commit to an existing PR. The job should run without a dropdown and use
CIT. To practice failure handling, temporarily introduce a failing unit test on
a feature branch: the test step should fail and the build step should be skipped.
Revert the intentional failure afterward.

A successful Actions run compiles the app on the runner; it does not publish a
website. Use the local commands below to see the environment label in a browser.

### Test each environment locally

After `nvm use` and `npm ci`, run the same checks as CI:

```bash
npx tsc --noEmit -p tsconfig.app.json
npm test -- --watch=false
npm run build -- --configuration=cit
npm run build -- --configuration=dev
npm run build -- --configuration=production
```

Start one environment at a time, then open `http://localhost:4200`:

```bash
npm start -- --configuration=cit
npm start -- --configuration=dev
npm start -- --configuration=production
```

Stop the current server with Ctrl+C before starting another. The page will show
`Environment: CIT`, `Environment: DEV`, or `Environment: PRODUCTION`.
