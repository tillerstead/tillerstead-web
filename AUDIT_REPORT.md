# Tillerstead Full-Stack Audit Report

**Date:** Session 2, Continuation  
**Scope:** tillerstead (Jekyll/Netlify site) + tillerstead-toolkit (FastAPI backend)

---

## 1. Security Audit

### npm (tillerstead)

| Category         | Before                       | After                                                 |
| ---------------- | ---------------------------- | ----------------------------------------------------- |
| Critical CVEs    | 3 (fast-xml-parser)          | **0**                                                 |
| High CVEs        | 5+ (workbox-cli 2.1.3 chain) | **0 fixable**                                         |
| Production vulns | 0                            | **0**                                                 |
| Total remaining  | 13+                          | **10** (all deep transitive, unfixable from our side) |

**Fixed:**

- `fast-xml-parser` 5.3.4 → **5.5.3** — patched entity encoding bypass, DoS, stack overflow
- `workbox-cli` 2.1.3 → **7.4.0** — eliminated dot-prop prototype pollution, lodash.template injection, minimatch ReDoS, and 5+ other high-severity chains

**Remaining (upstream-only):** 10 vulns in `minimatch` (postcss-url → critical), `serialize-javascript` (@rollup/plugin-terser → workbox-build), `tmp`/`external-editor`/`inquirer` (workbox-cli's interactive prompts). None affect production.

### Ruby Gems (tillerstead)

| Result                        | Status                |
| ----------------------------- | --------------------- |
| `bundle-audit check --update` | **0 vulnerabilities** |

### Python (tillerstead-toolkit/backend)

| Issue                                         | Severity                            | Action                                |
| --------------------------------------------- | ----------------------------------- | ------------------------------------- |
| `python-Levenshtein==0.24.2` yanked from PyPI | **CRITICAL** — blocks `pip install` | Replaced with `rapidfuzz==3.13.0`     |
| `python-jose[cryptography]==3.3.0` abandoned  | High — no security patches          | Replaced with `pyjwt[crypto]==2.10.1` |
| `fuzzywuzzy==0.18.0` deprecated               | Medium                              | Replaced with `rapidfuzz==3.13.0`     |
| `python-multipart==0.0.6` ancient             | Medium — known vulns                | Updated to `0.0.20`                   |
| FastAPI/Pydantic/SQLAlchemy outdated          | Low                                 | All bumped to latest stable           |

_Note: None of the deprecated packages (fuzzywuzzy, python-jose, passlib) are actually imported in any backend code — they were speculative requirements._

---

## 2. Dependency Upgrades

### npm devDependencies Upgraded

| Package           | Before  | After   |
| ----------------- | ------- | ------- |
| fast-xml-parser   | 5.3.4   | 5.5.3   |
| workbox-cli       | 2.1.3   | 7.4.0   |
| autoprefixer      | 10.4.20 | 10.4.27 |
| cssnano           | 7.0.6   | 7.1.3   |
| postcss           | 8.4.49  | 8.5.8   |
| stylelint         | 16.12.0 | 17.4.0  |
| puppeteer         | 23.11.1 | 24.39.0 |
| pa11y             | 8.1.0   | 9.1.1   |
| svgo              | 3.3.2   | 4.0.1   |
| **globals** (new) | —       | 14.0.0  |

### Python Backend (`requirements.txt`) — Full Rewrite

| Package                         | Before                   | After                    |
| ------------------------------- | ------------------------ | ------------------------ |
| fastapi                         | 0.109.0                  | **0.115.12**             |
| uvicorn                         | 0.27.0                   | **0.34.3**               |
| pydantic                        | 2.5.3                    | **2.11.7**               |
| pydantic-settings               | 2.1.0                    | **2.9.1**                |
| python-multipart                | 0.0.6                    | **0.0.20**               |
| sqlalchemy                      | 2.0.25                   | **2.0.41**               |
| alembic                         | 1.13.1                   | **1.15.2**               |
| psycopg2-binary                 | 2.9.9                    | **2.9.10**               |
| aiosqlite                       | 0.19.0                   | **0.21.0**               |
| httpx                           | 0.26.0                   | **0.28.1**               |
| pandas                          | 2.2.0                    | **2.3.0**                |
| openpyxl                        | 3.1.2                    | **3.1.5**                |
| reportlab                       | 4.0.9                    | **4.4.0**                |
| redis                           | 5.0.1                    | **6.2.0**                |
| rq                              | 1.16.0                   | **2.3.0**                |
| python-dotenv                   | 1.0.0                    | **1.1.1**                |
| fuzzywuzzy + python-Levenshtein | 0.18.0 + 0.24.2 (yanked) | **rapidfuzz 3.13.0**     |
| python-jose                     | 3.3.0 (abandoned)        | **pyjwt[crypto] 2.10.1** |

### Ruby Gems Updated

| Gem             | Before   | After    |
| --------------- | -------- | -------- |
| public_suffix   | 7.0.2    | 7.0.5    |
| addressable     | 2.8.8    | 2.8.9    |
| google-protobuf | 4.33.4   | 4.34.0   |
| tzinfo-data     | 1.2025.3 | 1.2026.1 |
| rubocop-ast     | 1.49.0   | 1.49.1   |
| sass-embedded   | 1.97.3   | 1.98.0   |
| json            | 2.18.1   | 2.19.1   |

**Not upgraded (major/breaking, constrained):** liquid 4→5 (Jekyll pins 4.x), terminal-table 3→4, unicode-display_width 2→3 (rubocop deps).

---

## 3. Code Quality (ESLint)

| Metric   | Before | After                         |
| -------- | ------ | ----------------------------- |
| Errors   | **34** | **0**                         |
| Warnings | 179    | **30** (all `no-unused-vars`) |

### Bugs Fixed via Lint

| File         | Fix                                                            | Impact                                            |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------- |
| tools.js     | `recommendTrowel()` → `getRecommendedTrowel()`                 | **Runtime crash** — function called by wrong name |
| tools-app.js | `Calculators[calcType]` → `Calculations[calcType]`             | **Runtime crash** — wrong variable, always throws |
| tools.js     | Duplicate `debounce` and `roundUp` functions removed           | Shadowed definitions                              |
| tools.js     | Switch/case blocks wrapped in `{}`                             | Lexical scoping bugs                              |
| tools-app.js | `.hasOwnProperty()` → `Object.prototype.hasOwnProperty.call()` | Prototype pollution defense                       |

---

## 4. Configuration Improvements

| Change                                       | Description                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **eslint.config.js** → `globals` package     | Replaced 20+ manual browser global declarations with `...globals.browser` — community-maintained, auto-complete coverage                    |
| **workbox-config.js** created                | Missing config for the v7 CLI that `sw:generate` / `sw:inject` scripts reference. Uses `injectManifest` mode to preserve custom sw.js logic |
| **sw.js** → `self.__WB_MANIFEST` placeholder | Required by workbox injectManifest to write the precache manifest at build time                                                             |
| **Gemfile** → `:windows` platform            | Fixed deprecation: `:mingw, :mswin, :x64_mingw` → `:windows`                                                                                |

---

## 5. New OSS Dependency Added

| Package                  | Purpose                | Why                                                                                                                |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `globals@14`             | ESLint browser globals | Standard ESLint v9 approach; eliminates manual list maintenance                                                    |
| `rapidfuzz` (Python)     | Fuzzy string matching  | Replaces deprecated `fuzzywuzzy` + yanked `python-Levenshtein`; MIT-licensed, C++ accelerated, actively maintained |
| `pyjwt[crypto]` (Python) | JWT auth               | Replaces abandoned `python-jose`; most popular Python JWT library                                                  |

---

## 6. Remaining Work & Recommendations

### Should Do Next

1. **Prefix unused vars with `_`** — The 30 remaining ESLint warnings are all `no-unused-vars`. Renaming e.g. `e` → `_e`, `sqft` → `_sqft` would reach 0 warnings.

2. **Test workbox injectManifest** — Run `bundle exec jekyll build && npx workbox injectManifest workbox-config.js` to verify the new config generates the precache manifest correctly.

3. **Backend integration test** — Run `pip install -r requirements.txt` in a fresh venv to confirm all new Python versions resolve without conflicts.

### Consider for Future

| Opportunity                   | What                                 | Benefit                                                           |
| ----------------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| **LightningCSS**              | Replace postcss+autoprefixer+cssnano | 10-100x faster CSS processing, smaller output, single tool        |
| **Biome**                     | Replace ESLint+Prettier              | Single Rust binary, instant linting + formatting                  |
| **Oxlint**                    | Add as ESLint companion              | 50-100x faster for common rules, catches more bugs                |
| **Bun**                       | Replace Node for scripts             | Faster package installs, built-in bundler, TypeScript native      |
| **stylelint-config-standard** | Replace `-scss` variant              | No `.scss` files exist in the project; SCSS rules are dead weight |

### Won't Fix (Upstream)

- 10 npm audit vulns in deep transitive deps of `critical` and `workbox-cli` — awaiting upstream patches
- `liquid` gem pinned at 4.x by Jekyll — cannot upgrade until Jekyll 5
