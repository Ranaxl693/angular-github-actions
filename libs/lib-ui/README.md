# Granular UI libraries POC

- `ui-card`: host and mfe1
- `ui-button`: mfe2
- UI components are stateless and bundled with their actual consumers; core and state federation mappings remain unchanged.

After installing dependencies, validate:

```sh
npx nx run-many -t lint,typecheck,test,build --projects=ui-card,ui-button,host,mfe1,mfe2
npx nx show projects --affected --files=libs/lib-ui/card/src/lib/card.ts
npx nx show projects --affected --files=libs/lib-ui/button/src/lib/button.ts
```

Expected: card change affects ui-card, host and mfe1; button change affects ui-button and mfe2 (subject to any additional graph edges). Inspect `npx nx graph` if unexpected projects appear. The migration itself changes global config, so use a subsequent component-only change or the explicit file simulation to measure granularity.

The existing GitHub Actions cache POC deliberately builds all apps and is not changed here. It is not an affected-only build benchmark.
