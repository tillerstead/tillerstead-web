# Phase 13D — CI and Test Infrastructure Gap Audit

**Date:** 2026-03-08  
**Status:** COMPLETE (audit documented)

---

## Test Suite Coverage

| Repo                   | Test Files                       | Framework        | Test Script        | Status   |
| ---------------------- | -------------------------------- | ---------------- | ------------------ | -------- |
| tillerstead            | 12 (Playwright + Jest)           | Playwright, Jest | `npm run test:nav` | GOOD     |
| evident                | ~55 (Playwright + Jest + Pytest) | Multiple         | Placeholder only   | DEGRADED |
| founder-hub            | 33 (Vitest .test.ts)             | Vitest           | `vitest run`       | GOOD     |
| contractor-cc          | 7 (.test.ts/.tsx)                | None configured  | None               | DEGRADED |
| civics-hierarchy       | 0                                | None             | None               | MISSING  |
| doj-document-library   | 0                                | None             | None               | MISSING  |
| essential-goods-ledger | 0                                | None             | None               | MISSING  |
| geneva-bible-study     | 0                                | None             | None               | MISSING  |
| informed-consent       | 0                                | None             | None               | MISSING  |
| sweat-equity-insurance | 0                                | None             | None               | MISSING  |

**Summary:** 4/10 repos have test files. 2/10 have working test scripts. 6/10 have zero tests.

## CI Workflow Coverage

| Tier          | Repos                                           | Workflow Count | Capabilities                                                               |
| ------------- | ----------------------------------------------- | -------------- | -------------------------------------------------------------------------- |
| Comprehensive | evident                                         | 21             | CI, CodeQL, security scans, Lighthouse, deploy, media, license enforcement |
| Solid         | founder-hub                                     | 8              | CI, Pages, deploy approval gate, backup, health, release                   |
| Basic+        | tillerstead                                     | 4              | CI quality, Jekyll deploy, Lighthouse, dependency audit                    |
| Minimal+      | geneva-bible-study                              | 3              | Deploy + 2 Lighthouse workflows                                            |
| Deploy-only   | civics, doj, essential, informed, contractor-cc | 1 each         | Legacy static deploy only                                                  |
| None          | sweat-equity-insurance                          | 0              | No git, no CI                                                              |

## Branch Protection

| Repo        | CODEOWNERS      | Branch Rules (local evidence) |
| ----------- | --------------- | ----------------------------- |
| tillerstead | YES (`@xTx396`) | Likely configured             |
| evident     | YES (`@xTx396`) | Likely configured             |
| All others  | NO              | Unknown (set via GitHub UI)   |

## Critical Gaps Identified

### Gap 1: Evident Test Script is a No-Op

- `package.json` has `"test": "node -e \"console.log('No JS tests configured.')\""` despite having 55+ test files
- **Recommendation:** Wire up to `vitest run` or `jest` or `playwright test`

### Gap 2: Contractor CC Has Tests But No Runner

- 7 test files exist but no test framework configured in package.json
- **Recommendation:** Add `vitest` dev dependency and `"test": "vitest run"` script

### Gap 3: 5 Satellites Are Deploy-Only

- civics, doj, essential, informed, contractor-cc all have a single deploy workflow
- No linting, no type checking, no security scanning before deploy
- **Recommendation:** Add pre-deploy CI step with `tsc --noEmit` and `eslint`

### Gap 4: 6 Repos Have Zero Tests

- Represents the largest governance gap in the ecosystem
- **Recommendation (phased):**
  1. Phase 14: Add smoke tests (build succeeds + index.html renders)
  2. Phase 15: Add critical path tests per app
  3. Phase 16: Add Lighthouse CI to all repos

### Gap 5: Sweat Equity Insurance Has No Infrastructure

- No git, no package.json, no CI, no tests
- Just 7 static HTML files and a JS data file
- **Recommendation:** Initialize git repo, add to GitHub, add deploy workflow

## Security Scanning

| Repo        | CodeQL | Security Scan | License Check | Dep Audit |
| ----------- | ------ | ------------- | ------------- | --------- |
| evident     | YES    | YES           | YES           | NO        |
| tillerstead | NO     | NO            | NO            | YES       |
| All others  | NO     | NO            | NO            | NO        |

**Recommendation:** Add CodeQL or `npm audit` workflow to all repos with dependencies.
