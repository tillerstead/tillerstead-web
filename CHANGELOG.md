## TillerPro Tools Migration — 2026-03-31

### Moved

-     ools-hub.html (Quote Suite) → Contractor Command Center
-     ile-visualizer.html → Contractor Command Center
-     ools.html (Build Calculators) → Contractor Command Center
- ssets/js/ TillerPro modules → /apps/contractor-command-center/tillerpro/assets/js/
- ssets/css/ TillerPro styles → /apps/contractor-command-center/tillerpro/assets/css/

Old tool URLs now redirect to: https://www.xtx396.com/apps/contractor-command-center/
Backup archive: scripts/backup/tillerstead-decommission-backup-20260331-225612.zip

# Changelog

All notable changes to the Tillerstead website are documented here.

---

## [1.1.0] — 2026-01-27

### Phase 2 — Production Hardening (Cross-Venture)

#### Fixed

- Removed invalid `loading="lazy"` attribute from `<section>` element on
  homepage portfolio section
- Removed redundant `role="main"` from `<main>` element in page shell
- Removed `tabindex="0"` from 6 non-interactive footer containers (footer-main,
  footer-nav, footer-contact-grid, footer-bottom, footer-social, footer-legal)
- Removed redundant `role="contentinfo"` from footer element

#### Added

- `article:published_time` and `article:author` Open Graph meta tags for blog
  posts in `meta-open-graph.html`
- `aria-label` attributes on CTA links in sticky mobile CTA and desktop sticky
  CTA components (SMS, contact, phone)
- `aria-hidden="true"` on all decorative SVGs in CTA components (7 total)
- Mobile nav toggle now updates `aria-label` between "Open navigation menu"
  and "Close navigation menu" for screen reader clarity
- **Structured data `@graph`** restructure in `schema-combined.js`: separated
  HomeAndConstructionBusiness, WebSite, SiteNavigationElement, and FAQPage as
  proper top-level graph entities; TechArticle now conditional on build guide
  pages only
- **Cross-site schema references**: `sameAs` now includes devon-tyler.com and
  xtx396.com
- **Shared venture design tokens** (`assets/css/shared-venture-tokens.css`):
  common typography, color primitives, radius, and shadow scale
- **CI hardening**: concurrency control, explicit permissions, timeout protection
  on all CI jobs

#### Changed

- Deferred 13 non-critical CSS files using `media="print" onload` pattern:
  AOS, micro-interactions, glassmorphism, gradients, animations, hero-patterns,
  tile-patterns, tile-integrations, retro-enhancements, animations/core,
  visual-enhancements, sticky-cta, lead-magnet, animations.css
- Deferred vendor JS (Lenis, AOS, vendor-init) with `defer` attribute
- Shared venture tokens loaded before root-vars.css in head.html
