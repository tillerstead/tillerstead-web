# Phase 10C — Release Discipline Report

**Date:** 2025-06-05
**Status:** COMPLETE

## Executive Summary

Every repo in the Evident ecosystem deploys directly on push to main with **zero test gates**. PR checks exist in 4 repos but do not block merge or deployment. This means a broken commit pushed to main goes live immediately.

## Current State

### Deploy Trigger Matrix

| Repo                   | Deploy on push:main | PR checks exist | Tests gate deploy | cancel-in-progress |
| ---------------------- | :-----------------: | :-------------: | :---------------: | :----------------: |
| Evident                |         ✅          |  10 workflows   |      **NO**       |        true        |
| Founder-Hub            |  ✅ (2 competing!)  |   5 workflows   |      **NO**       |       mixed        |
| Tillerstead            |         ✅          |   2 workflows   |      **NO**       |       false        |
| Civics Hierarchy       |         ✅          |    **NONE**     |      **NO**       |        true        |
| DOJ Document Library   |         ✅          |    **NONE**     |      **NO**       |        true        |
| Essential Goods Ledger |         ✅          |    **NONE**     |      **NO**       |        true        |
| Geneva Bible Study     |         ✅          | 1 (Lighthouse)  |      **NO**       |       false        |
| Informed Consent       |         ✅          |    **NONE**     |      **NO**       |       false        |
| Contractor CC          |         ✅          |    **NONE**     |      **NO**       |        true        |
| Sweat Equity Insurance |     N/A (no CI)     |    **NONE**     |      **N/A**      |        N/A         |

### Critical Findings

1. **Zero deploy gates across all 10 repos.** No repository gates deployment behind successful CI. Every push-to-main fires an ungated deploy.

2. **Founder-Hub has competing deploy pipelines.** `pages.yml` and `deploy-approval.yml` both fire on push to main. The sophisticated approval gates in `deploy-approval.yml` (commit signature verification, environment approvals, deployment windows) are completely bypassed by the simpler `pages.yml`.

3. **6 satellites have NO PR-level checks at all.** Any change merged (or pushed directly) to main deploys without any quality verification.

4. **No branch protection required status checks.** Even where PR-level CI workflows exist (Evident has 10!), none are configured as required checks — they run but don't block merge.

5. **`cancel-in-progress` is inconsistent.** Deploy workflows use `true` in 5 repos and `false` in 4. For deploy workflows, `false` is safer (ensures every merge deploys rather than potentially canceling mid-deploy).

## Recommendations

### Tier 1 — Immediate (no risk)

| Action                                                          | Impact                            | Effort                        |
| --------------------------------------------------------------- | --------------------------------- | ----------------------------- |
| Add `satellite-ci.yml` to all 6 satellites                      | PR build verification             | Copy template file per repo   |
| Standardize `cancel-in-progress: false` on all deploy workflows | Prevent deploy cancellation races | 1-line edit per affected repo |

### Tier 2 — Moderate (requires GitHub settings)

| Action                                                | Impact                          | Effort                        |
| ----------------------------------------------------- | ------------------------------- | ----------------------------- |
| Enable branch protection on `main` for all repos      | Prevent direct pushes           | GitHub repo settings          |
| Set CI workflow as required status check              | Block merge on build failure    | GitHub repo settings per repo |
| Disable or add path filter to Founder-Hub `pages.yml` | Eliminate competing deploy path | Edit workflow trigger         |

### Tier 3 — Advanced (optional hardening)

| Action                                               | Impact                        | Effort                      |
| ---------------------------------------------------- | ----------------------------- | --------------------------- |
| Add `workflow_run` gate: deploy only after CI passes | Enforce test-before-deploy    | Workflow restructure        |
| Add deploy approval environment on satellite repos   | Manual approval before deploy | GitHub environment settings |
| Add post-deploy smoke tests to all deploy workflows  | Detect broken deploys fast    | Add curl check step         |

## Templates Created

Two reusable workflow templates have been created:

- **`dev/templates/satellite-ci.yml`** — PR-level build verification for satellites
- **`dev/templates/satellite-deploy.yml`** — Standardized deploy workflow with validation gates

### Deploying Templates

To add CI to a satellite repo:

```bash
# From the satellite repo root:
mkdir -p .github/workflows
cp <tillerstead>/dev/templates/satellite-ci.yml .github/workflows/ci.yml
# Replace the existing deploy.yml if desired:
cp <tillerstead>/dev/templates/satellite-deploy.yml .github/workflows/deploy.yml
git add .github/workflows/
git commit -m "ci: add PR build verification + deploy validation"
git push
```

## Changes Applied This Phase

| File                                 | Change                                                 |
| ------------------------------------ | ------------------------------------------------------ |
| `dev/templates/satellite-ci.yml`     | Created — reusable CI template for satellite repos     |
| `dev/templates/satellite-deploy.yml` | Created — standardized deploy workflow with validation |

## Recommended `cancel-in-progress` Standardization

All deploy workflows should use `cancel-in-progress: false` to prevent mid-deploy cancellation:

| Repo             | Current Value | Recommended |             Change Needed              |
| ---------------- | :-----------: | :---------: | :------------------------------------: |
| Evident          |     true      |  **false**  | Yes — edit `deploy-eleventy-pages.yml` |
| Tillerstead      |     false     |    false    |                   No                   |
| Civics           |     true      |  **false**  |                  Yes                   |
| DOJ              |     true      |  **false**  |                  Yes                   |
| Essential Goods  |     true      |  **false**  |                  Yes                   |
| Geneva Bible     |     false     |    false    |                   No                   |
| Informed Consent |     false     |    false    |                   No                   |
| Contractor CC    |     true      |  **false**  |                  Yes                   |

> **Note:** These changes require editing remote repo files. They are documented here for manual application since the satellite `.github/workflows/` directories are not present in the local workspace.

## Founder-Hub Competing Pipeline Fix

**BLOCKED** — Founder-Hub workspace is empty locally. The recommended fix:

- Remove `on: push: branches: ["main"]` from `pages.yml` (keep only `workflow_dispatch`)
- OR add `paths-ignore` filter to avoid conflict with `deploy-approval.yml`
- This ensures the approval gates in `deploy-approval.yml` are the only production deploy path
