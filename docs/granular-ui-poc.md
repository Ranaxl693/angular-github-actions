# Granular UI Nx projects

The parent libs/lib-ui is a grouping folder only. Host and mfe1 use ui-card; mfe2 uses ui-button. Federation mappings and explicit Nx dependencies are scoped accordingly. Core and state remain unchanged.

After the migration is committed, validate dependency isolation with:

    npx nx show projects --affected --files=libs/lib-ui/card/src/lib/card.ts --json
    npx nx show projects --affected --files=libs/lib-ui/button/src/lib/button.ts --json

Expected UI consumers: card → host, mfe1; button → mfe2. Inspect any additional graph edges if output differs. Run all lint, typecheck, test, and build targets for the initial migration, then repeat with isolated changes. Run federation e2e after building Pages artifacts.

The existing CI workflow deliberately builds every app twice for remote cache verification and is not changed in this POC. For production affected-only CI, replace the explicit run-many build selection with affected tasks and preserve unchanged artifacts for deployment. A library used by every app still affects every app. This is not independent runtime library deployment.
