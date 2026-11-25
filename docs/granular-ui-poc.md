# Granular UI Nx projects

The parent libs/lib-ui is a grouping folder only. Host and mfe1 use ui-card; mfe2 uses ui-button. Federation mappings and explicit Nx dependencies are scoped accordingly. Core and state remain unchanged.

After the migration is committed, validate dependency isolation with:

    npx nx show projects --affected --files=libs/lib-ui/card/src/lib/card.ts --json
    npx nx show projects --affected --files=libs/lib-ui/button/src/lib/button.ts --json

Expected UI consumers: card → host, mfe1; button → mfe2. Inspect any additional graph edges if output differs. Run all lint, typecheck, test, and build targets for the initial migration, then repeat with isolated changes. Run federation e2e after building Pages artifacts.

## CI policy

PR validation runs lint, typecheck, test and build in four parallel jobs using Nx affected, with the same pinned base/head. Superseded PR runs are cancelled. Nx Cloud is disabled for these workflows; npm dependency caching remains enabled. No duplicate full-app cache-verification build or PR deployment is performed.

GitHub Pages requires a complete site. A separate workflow builds and deploys the complete site once on develop pushes or manual dispatch. This intentionally does not deploy partial PR artifacts or overwrite unaffected applications. Independent production deployment requires a per-app artifact store or deployment target, which is outside this POC.

A library used by every app still affects every app. Shared root configuration changes may also affect all apps. This is not independent runtime library deployment.
