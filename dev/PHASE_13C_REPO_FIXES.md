# Phase 13C — Remote / Local Repo Fixes

**Date:** 2026-03-08  
**Status:** COMPLETE (local fixes applied)

---

## Fixes Applied Locally

### 1. Contractor CC — Hardcoded 127.0.0.1

- **File:** `contractor-command-center/src/components/invoices/RetainageReleaseWorkflow.tsx`
- **Line 288:** `signerIP: '127.0.0.1'` changed to `signerIP: 'client'`
- **Risk:** IP was hardcoded placeholder in e-signature metadata. Not a security risk but misleading in audit logs.

### 2. Evident — Sitemap Contamination

- **File:** `evident/sitemap.xml`
- **Problem:** Root sitemap.xml contained 197 lines of Tillerstead page URLs (services, portfolio, county pages, build guides) mapped to `www.xtx396.com`. This was clearly copy-pasted from Tillerstead during initial setup.
- **Fix:** Replaced with correct 9-URL Evident sitemap matching `src/sitemap.xml` content (home, about, apps, docs, pricing, contact, faq, privacy, terms).
- **Impact:** Prevents search engines from indexing 25+ non-existent URLs when domain goes live.

## Fixes Not Applied (Intentional)

### 3. DOJ Document Library — localhost:8080 References

- **Files:** `ConnectionDialog.tsx`, `SetupGuide.tsx`, `engineClient.ts`
- **Decision:** NOT FIXED. These are intentional defaults for a tool that connects to a local Docker search engine. The `localhost:8080` is the correct default for the local engine setup.

### 4. Tillerstead — api-config.js localhost

- **Status:** Already fixed in Phase 11 (empty string fallback instead of localhost:8000).

## Fixes Requiring Remote Action (local workspace empty)

### 5. Founder-Hub — Missing canonical tag

- **Problem:** `devon-tyler.com` has no `<link rel="canonical">` tag
- **Action:** Add to `index.html` on GitHub: `<link rel="canonical" href="https://devon-tyler.com/">`
- **Priority:** LOW (site is live and functional)

### 6. Founder-Hub — Missing robots.txt

- **Problem:** `devon-tyler.com` returns 404 for `/robots.txt`
- **Action:** Create `public/robots.txt` on GitHub with standard allow-all + sitemap ref
- **Priority:** LOW

### 7. Founder-Hub — site.config.ts localhost domain default

- **Problem:** May have localhost as fallback domain in site configuration
- **Action:** Verify on GitHub and update if found
- **Priority:** MEDIUM
