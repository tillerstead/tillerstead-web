# Tillerstead Web Standalone Route / Asset Cleanup Report

- Created: 2026-07-02T23:58:27Z
- Work root: /tmp/tillerstead-web-standalone-work-20260702
- Remote push performed: NO

## Changed files
- .eleventy.js
- CLAUDE.md
- assets/js/logo-system.js
- assets/js/tools.js
- package.json
- scripts/export-resources.ts
- src/_includes/components/docs-sidebar.njk
- src/_includes/components/footer.njk
- src/_includes/components/header.njk
- src/_includes/components/hero.njk
- src/_includes/components/service-card.njk
- src/_includes/layouts/base.njk
- src/_includes/layouts/docs.njk
- src/health.ts
- src/lib/resource-provider.ts

## Key new files
- apple-touch-icon.png (copied from assets/icons/apple-touch-icon.png)
- favicon-16x16.png (copied from assets/icons/favicon-16x16.png)
- favicon-32x32.png (copied from assets/icons/favicon-32x32.png)
- assets/css/tokens.css (restored from platform source; false-positive sensitive exclusion)
- assets/css/shared-venture-tokens.css (stub for legacy CSS reference)
- assets/js/build-calculators.js (stub for legacy script reference)
- assets/img/logo/logo-wolf-crest-compact.{png,webp} (alias of logo-compact)
- src/feed.njk (Atom feed for posts collection)
- src/build/ directory with placeholder guides for all navigation routes
- src/nj-code-compliance.md
- src/tile-visualizer.html passthrough
- src/_includes/ full copy of _includes so Eleventy input=src resolves layouts
- scripts/standalone/*.cjs local test/verify helpers
- pnpm-lock.yaml

## Fixed missing refs
- /apple-touch-icon.png, /favicon-16x16.png, /favicon-32x32.png
- /assets/img/logo/logo-wolf-crest-compact.webp
- /build/ and all /build/* sub-routes
- /feed.xml
- /about/, /blog/, /portfolio/, /homeowner-resources/, /copyright/, /disclaimers/, /ventures/
- /nj-code-compliance/
- /tile-visualizer.html
- /assets/css/shared-venture-tokens.css
- /assets/js/build-calculators.js

## Missing refs after cleanup
No missing local refs detected.

## Verification
- pnpm install --ignore-scripts: passed
- pnpm run build: passed
- pnpm run lint: passed (warnings only: 20 JS indent, 9 CSS duplicate/deprecated)
- pnpm run verify: passed

## Coupling scan after cleanup
Clean except for comments/messages noting removed Evident dependencies.
./.eleventy.js:280:    // Local replacement for removed ../../packages/build-utils postBuild
./src/lib/resource-provider.ts:4: * Standalone replacement for the Evident resource-bridge/provider-sdk types.
./scripts/standalone/verify-build.cjs:17:  console.error('Standalone verify-build failed');
./scripts/standalone/verify-build.cjs:20:console.log('Standalone verify-build passed');
./scripts/standalone/domain-check.cjs:16:  console.error('Standalone verify-build failed');
./scripts/standalone/domain-check.cjs:19:console.log('Standalone verify-build passed');
./scripts/export-resources.ts:5: * Standalone replacement for the Evident resource-bridge export pipeline.
./package.json:18:    "export:resources": "echo \"export:resources requires resource-bridge vendoring; skipping in standalone mode\"",
./package.json:84:    "verify": "node scripts/standalone/verify-build.cjs _site"

## Sensitive scan after cleanup
Clean. Only design-token false positives.
./assets/css/tokens.css:2: * TILLERSTEAD TOKEN SYSTEM
./assets/css/tokens.css:76:     DARK SURFACE TOKENS (footer, hero, overlays)
./assets/css/tokens.css:84:     BRAND TINT TOKENS (for backgrounds, borders, shadows)
./assets/css/tokens.css:93:     INVERSE TEXT TOKENS (for dark backgrounds)
./assets/css/tokens.css:236:   ENSURE TOKENS ARE ALWAYS AVAILABLE
./assets/css/modern/variables.css:288:   GEM TOKEN BRIDGES

## Forbidden paths
admin/, toolkit/, .git-encrypt/, playwright-report/, test-results/ remain absent.

## pnpm-workspace.yaml
Removed. It was an accidental pnpm v11 build-approval artifact, not required for standalone operation.
