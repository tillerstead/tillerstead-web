# Cloudflare Preview Runbook

This repo is the standalone public website for Tillerstead LLC.

Current deployment status:

* GitHub repo: `tillerstead/tillerstead-web`
* Current initial commit: `f717b73653f4ace34926dcd7fdec7be957e7458c`
* Cloudflare preview is blocked until a valid token is available.
* Do not attach `tillerstead.com` until preview deployment and smoke checks pass.

## Required Cloudflare token capability

Use a Cloudflare API token that can manage Pages for the correct account.

Minimum intended capabilities:

* Cloudflare Pages edit/deploy capability
* Account read access
* Zone read access
* Zone edit only if DNS changes are explicitly approved

Do not commit the token.
Do not print the token.
Do not store the token in this repository.

## Preview-only deployment

After auth succeeds:

```bash
pnpm install --ignore-scripts
pnpm run lint
pnpm run build
pnpm run verify

pnpm exec wrangler pages project create tillerstead-web --production-branch main

pnpm exec wrangler pages deploy _site \\
  --project-name tillerstead-web \\
  --branch preview-carveout-20260702 \\
  --commit-hash f717b73653f4ace34926dcd7fdec7be957e7458c \\
  --commit-message "Preview standalone Tillerstead web carve-out"
```

## Required preview checks

Check:

* `/`
* `/about/`
* `/contact/`
* `/build/`
* `/build/nj-codes-permits/`
* `/feed.xml`
* `/privacy/`
* `/terms/`
* root favicons
* logo asset
* no `/admin/`
* no `/toolkit/`
* no private ops exposure

## DNS rule

Do not cut over `tillerstead.com` until preview smoke checks pass and an explicit DNS approval is given.
