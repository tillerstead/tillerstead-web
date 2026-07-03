# Tillerstead Web Standalone Adaptation Report

- Created: 2026-07-02T23:43:28Z
- Work root: /tmp/tillerstead-web-standalone-work-20260702
- Source export: /tmp/tillerstead-web-export-20260702/files
- Provenance: /tmp/tillerstead-web-export-20260702/PROVENANCE-tillerstead-web-20260702.md
- Remote push performed: NO

## Changed files
- .eleventy.js
- CLAUDE.md
- package.json
- scripts/export-resources.ts
- src/health.ts
- src/lib/resource-provider.ts

## New files
- assets/css/tokens.css
- pnpm-lock.yaml
- pnpm-workspace.yaml
- scripts/standalone/domain-check.cjs
- scripts/standalone/http-check.cjs
- scripts/standalone/smoke-check.cjs
- scripts/standalone/verify-build.cjs

## Dependency replacements
- Removed `@evident-technologies/resource-bridge` and `@evident-technologies/types` from package.json
- Replaced `../../packages/build-utils` postBuild with local BUILD_INFO.json writer in .eleventy.js
- Replaced monorepo test/verify script paths with local `scripts/standalone/*.cjs` helpers
- Inlined PackageHealth type in src/health.ts
- Inlined resource types in src/lib/resource-provider.ts
- Made scripts/export-resources.ts self-contained using local fs writes
- Added `@eslint/js` devDependency for ESLint flat config
- Restored `assets/css/tokens.css` after standalone build revealed it was a false-positive sensitive-pattern exclusion

## Verification
- Local install: passed (with --ignore-scripts for optional native deps)
- Standalone build: passed
- `pnpm run verify`: passed
- `pnpm run lint`: passed (warnings only: 20 JS indent, 9 CSS duplicate/deprecated)

## Remaining coupling
Only comment/script-message references remain:
- .eleventy.js comment noting the removed `../../packages/build-utils` postBuild
- package.json `export:resources` script message

## Sensitive scan
Clean. Only design-token false positives (e.g., 'TOKENS USED:', 'GEM TOKEN BRIDGES').

## Missing local refs in generated HTML (pre-existing; should be fixed before DNS cutover)
- MISSING: /apple-touch-icon.png
- MISSING: /assets/img/logo/logo-wolf-crest-compact.webp
- MISSING: /build/
- MISSING: /build/nj-codes-permits/
- MISSING: /favicon-16x16.png
- MISSING: /favicon-32x32.png
- MISSING: /feed.xml

## Notes
- `pnpm-workspace.yaml` is a pnpm v11 build-approval config artifact (allowBuilds for puppeteer/sharp), not a monorepo workspace file. Review before committing.
- `pnpm-lock.yaml` was generated during local install and should be committed if this worktree is pushed.

## Next step
Approve first push to empty tillerstead/tillerstead-web, or do one more cleanup pass for the missing refs above.
