# Phase 10B — Validation Automation Report

**Date:** 2025-06-05
**Status:** COMPLETE (8 of 9 workflows updated; 1 repo empty)

## Summary

Pre-build validation gates and post-build verification steps have been added to all deploy workflows across the Evident ecosystem. These gates catch misconfigurations before they reach production.

## Validation Pattern

### Pre-build checks (all repos)

| Check                                                | Severity | Action                                     |
| ---------------------------------------------------- | -------- | ------------------------------------------ |
| CNAME file exists                                    | ERROR    | Fail build — prevents broken custom domain |
| robots.txt exists                                    | WARNING  | Log warning — SEO impact only              |
| package.json name matches repo (Node projects)       | WARNING  | Log warning — drift detection              |
| site.json URL matches expected domain (Evident only) | ERROR    | Fail build — prevents stale URL            |

### Post-build checks (all repos)

| Check                                      | Severity | Action                             |
| ------------------------------------------ | -------- | ---------------------------------- |
| dist/index.html exists (Vite projects)     | ERROR    | Fail build — prevents empty deploy |
| \_site/index.html exists (Jekyll projects) | ERROR    | Fail build — prevents empty deploy |

## Workflows Modified

| #   | Repo                 | Workflow File             | Build System       | Output Dir | Pre-build                           | Post-build                   |
| --- | -------------------- | ------------------------- | ------------------ | ---------- | ----------------------------------- | ---------------------------- |
| 1   | civics-hierarchy     | deploy.yml                | Vite (Node 20)     | dist/      | ✅ CNAME, robots.txt, pkg name      | ✅ dist/index.html           |
| 2   | contractor-command-c | deploy.yml                | Vite (Node 20)     | dist/      | ✅ CNAME, robots.txt, pkg name      | ✅ dist/index.html           |
| 3   | doj-document-library | deploy.yml                | Vite (Node 20)     | dist/      | ✅ CNAME, robots.txt, pkg name      | ✅ dist/index.html           |
| 4   | essential-goods-ledg | deploy.yml                | Vite (Node 20)     | dist/      | ✅ CNAME, robots.txt, pkg name      | ✅ dist/index.html           |
| 5   | geneva-bible-study-t | deploy.yml                | Vite (Node 20)     | dist/      | ✅ CNAME, robots.txt, pkg name      | ✅ (pre-existing)            |
| 6   | informed-consent-com | deploy-pages.yml          | Vite (Node 22)     | dist/      | ✅ CNAME, robots.txt, pkg name      | ✅ dist/index.html           |
| 7   | evident              | deploy-eleventy-pages.yml | Eleventy (Node 22) | \_site/    | ✅ CNAME, robots.txt, site.json URL | ✅ (pre-existing smoke test) |
| 8   | tillerstead          | jekyll.yml                | Jekyll (Ruby 3.2)  | \_site/    | ✅ CNAME, robots.txt                | ✅ \_site/index.html         |

## Not Modified

| Repo                   | Reason                                         |
| ---------------------- | ---------------------------------------------- |
| Founder-Hub            | Local workspace empty — no files to modify     |
| Sweat Equity Insurance | No CI workflow exists (Phase 10E will address) |

## Validation Step Examples

### Vite Satellite (standard pattern)

```yaml
- name: Pre-build validation
  run: |
    echo "--- CNAME check ---"
    if [ ! -f CNAME ] && [ ! -f public/CNAME ]; then
      echo "::error::CNAME file missing"; exit 1
    fi
    echo "--- robots.txt check ---"
    if [ ! -f robots.txt ] && [ ! -f public/robots.txt ]; then
      echo "::warning::robots.txt missing (SEO impact)"
    fi
    echo "--- package.json name check ---"
    PKG_NAME=$(node -p "require('./package.json').name")
    REPO_NAME=$(basename "$GITHUB_REPOSITORY")
    if [ "$PKG_NAME" != "$REPO_NAME" ]; then
      echo "::warning::package.json name '$PKG_NAME' != repo name '$REPO_NAME'"
    fi
    echo "Validation passed"

- name: Verify build output
  run: |
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
      echo "::error::Build output missing dist/index.html"; exit 1
    fi
    echo "Build verified: $(ls dist/ | wc -l) files in dist/"
```

### Jekyll (Tillerstead)

```yaml
- name: Pre-build validation
  run: |
    echo "--- CNAME check ---"
    if [ ! -f CNAME ]; then
      echo "::error::CNAME file missing"; exit 1
    fi
    echo "--- robots.txt check ---"
    if [ ! -f robots.txt ]; then
      echo "::warning::robots.txt missing (SEO impact)"
    fi
    echo "Validation passed"

- name: Verify build output
  run: |
    if [ ! -d "_site" ] || [ ! -f "_site/index.html" ]; then
      echo "::error::Build output missing _site/index.html"; exit 1
    fi
    echo "Build verified: $(find _site -type f | wc -l) files in _site/"
```

## Impact

- **8 deploy pipelines** now have pre-build validation gates
- **CNAME deletion** will fail the build immediately (prevents broken custom domains)
- **Missing build output** will fail the build (prevents empty deploys)
- **Package name drift** and **missing robots.txt** generate warnings without blocking
- All checks use GitHub Actions annotation syntax (`::error::`, `::warning::`) for visibility in the Actions UI
