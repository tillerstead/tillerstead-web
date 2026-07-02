# TillerPro / Tillerstead.com — UX & Accessibility Optimization Guide

**For:** Claude Opus 0.6  
**Date:** February 10, 2026  
**Repo:** `xTx396/TillerPro` (branch: main)  
**Stack:** Jekyll 4.2 + Node 25 tooling · Dark-themed contractor site  
**Deploy:** Cloudflare Pages (tillerstead.com)

---

## Mission

Fix every accessibility, contrast, navigation, button, and spacing issue on
Tillerstead.com without changing content or brand feel. Install proper tooling.
Produce a site that meets WCAG 2.1 AA and is the best contractor site in South
Jersey.

---

## Phase A — Project Inventory (Complete)

### CSS Architecture (92+ files)

| Layer          | Key files                                                                                                                                                   | Role                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Tokens**     | `root-vars.css` (1254 lines), `design-tokens.css` (300 lines)                                                                                               | Two competing variable systems — **must reconcile** |
| **Layout**     | `main.css`, `header.css`, `footer.css` (616 lines), `header-nav-enhanced.css`                                                                               | Core layout                                         |
| **Nav**        | `components/ts-navigation.css` (656 lines), `navigation.css`, `navigation-complete.css`, `nav-drawer.css`, `mobile-nav-fix.css`, `hamburger-visibility.css` | 6+ nav-related files                                |
| **Mobile**     | `mobile-app.css`, `mobile-base.css`, `scroll-fix-mobile.css`, `mobile-emergency-fix.css`, `mobile-layout-emergency.css`, `mobile-critical-fix.css`          | 8+ mobile files — many "emergency" patches          |
| **Components** | `components/buttons.css`, `components/forms.css`, `components/cards.css`                                                                                    | Component styles                                    |
| **Fix Layers** | `fixes-comprehensive.css`, `contrast-alignment-fix.css`, `critical-ux-fixes.css`, `color-contrast-standard.css`, `header-emergency-fix.css`                 | Layered hotfixes with `!important`                  |
| **Tools SPA**  | `tools-app.css` (3499 lines)                                                                                                                                | Bottom nav, calculators, settings                   |

### Templates

| File                                       | Role                                                  |
| ------------------------------------------ | ----------------------------------------------------- |
| `_includes/layout/page-shell.html`         | Master shell (doctype→body)                           |
| `_includes/layout/head.html`               | `<head>` — **loads 50+ CSS files in complex order**   |
| `_includes/header.html`                    | Site header — uses `ts-navigation.html`               |
| `_includes/navigation/ts-navigation.html`  | **Active nav**: desktop `ts-nav` + mobile `ts-drawer` |
| `_includes/layout/footer.html` (433 lines) | Footer with navigation grid                           |
| `_includes/layout/scripts.html`            | JS includes                                           |

### JS Navigation (Two active, four dormant)

| File                                                                  | Active? | Selectors                                                           |
| --------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `navigation.js` (306 lines)                                           | **Yes** | `.ts-nav__trigger`, `.ts-nav-toggle`, `#ts-mobile-nav`              |
| `unified-navigation.js` (352 lines)                                   | **Yes** | `.mobile-nav__toggle`, `.desktop-nav__*` — **different selectors!** |
| `nav.js`, `nav-drawer.js`, `nav-premium.js`, `navigation-enhanced.js` | **No**  | Legacy, not loaded                                                  |

### Button Class Systems (Two conventions)

| Convention              | Examples                                           | Used In           |
| ----------------------- | -------------------------------------------------- | ----------------- |
| BEM `btn--*`            | `btn--primary`, `btn--ghost`, `btn--outline-light` | Main site pages   |
| Bootstrap-style `btn-*` | `btn-primary`, `btn-success`, `btn-danger`         | Tools/admin pages |

---

## Phase B — Top 20 Issues Audit

| #   | Type             | File/Template                 | Selector(s)                                      | Detail                                                                                                                                                                                                                      | Fix                                                                             |
| --- | ---------------- | ----------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | **Nav behavior** | `tools.html` bottom nav       | `.app-bottom-nav`                                | Bottom nav uses `var(--app-surface)` which resolves to undefined → **transparent background**. Hidden on desktop but broken even on mobile because tools-app.css vars not loaded on all viewports.                          | Define `--app-surface` fallback; ensure white/dark bg                           |
| 2   | **Nav behavior** | `tools.html` bottom nav       | `.app-bottom-nav__link`                          | `color: var(--app-text-muted)` — undefined var → **invisible text**. Also `font-size: 0.75rem` = 12px — below WCAG minimum.                                                                                                 | Provide fallback colors; bump to 13px min                                       |
| 3   | **Contrast**     | All pages (dark bg)           | `--tiller-text-tertiary: #9ca3af` on `#000000`   | 6.3:1 — passes AA for body text ✓ but `--tiller-text-muted: #6b7280` = **4.0:1 — FAIL AA** for normal text                                                                                                                  | Change `--tiller-text-muted` to `#8b929a` (≥ 4.5:1)                             |
| 4   | **Contrast**     | All pages                     | `color-contrast-standard.css`                    | Applies `!important` to ALL `p`, `h1-h6` — forces `color: #fff` and `font-weight: 900/600` globally, **overriding light-bg pages** and breaking layout                                                                      | Remove blanket `!important` rules; scope to `.bg-dark` only                     |
| 5   | **Contrast**     | Footer                        | `.footer-tagline`                                | Gold `#c9a227` on dark bg ≈ `#121414` → ratio ~5.3:1 — **passes AA for large text**, but body text next to it at `#9ca3af` may fail                                                                                         | OK for large text; ensure `.footer-service-tagline` uses `#e5e7eb` minimum      |
| 6   | **Button**       | All pages                     | `.btn--primary`                                  | Uses `var(--primary-500)` / `var(--primary-700)` — these are from `design-tokens.css` but resolve differently depending on which token file loads first. **Emerald on emerald gradient makes text invisible if vars fail.** | Add `#10b981` / `#047857` fallbacks in `buttons.css`                            |
| 7   | **Button**       | All pages                     | `.btn:focus-visible`                             | **Missing** — no focus-visible rule in `components/buttons.css`. Users can't see focused buttons.                                                                                                                           | Add `outline: 3px solid var(--tiller-color-gold, #d4af37); outline-offset: 2px` |
| 8   | **Button**       | All pages                     | `.btn--ghost`                                    | White text `#fff` on transparent bg + `border: 2px solid rgb(255 255 255 / 30%)` → border contrast 1.2:1 against dark bg — **FAIL** UI component contrast (need 3:1)                                                        | Change border to `rgb(255 255 255 / 60%)` minimum                               |
| 9   | **Spacing**      | All pages                     | `.ts-footer .footer-main`                        | `max-width: 1200px` is fine but `padding: 0 var(--tiller-spacing-md)` with `clamp(1rem, 2vw, 1.5rem)` — on small mobile this gives only 16px side padding, text hits edges                                                  | Set `min(1.25rem, 5vw)` floor                                                   |
| 10  | **Nav behavior** | Mobile drawer                 | `.ts-drawer`                                     | Drawer `z-index: 2000 !important` conflicts with `.ts-drawer__overlay` at `z-index: 1990 !important` and the body `overflow` isn't locked on iOS Safari                                                                     | Use `position: fixed; inset: 0` on body when nav-open                           |
| 11  | **Typography**   | `color-contrast-standard.css` | `p`                                              | `font-weight: 600 !important` on all `<p>` tags — makes ALL body text semi-bold, **hurting readability**                                                                                                                    | Remove; let design system handle weights                                        |
| 12  | **Spacing**      | Section headings              | `h1, h2, h3`                                     | `text-shadow: 0 2px 8px rgb(0 0 0 / 80%) !important` on ALL headings via `color-contrast-standard.css` — adds heavy shadow even on light backgrounds                                                                        | Scope to dark sections only                                                     |
| 13  | **Focus**        | All pages                     | `html { overflow-x: hidden }` in `root-vars.css` | Hides horizontal overflow globally — any focus ring that extends beyond viewport is clipped                                                                                                                                 | Use `overflow-x: clip` instead (preserves focus outlines)                       |
| 14  | **Tap target**   | Header                        | `.btn--sm` in header                             | `padding: 0.5rem 1rem` → renders ~36px tall on mobile — below 44px WCAG target                                                                                                                                              | Add `min-height: 44px` to `.btn--sm`                                            |
| 15  | **CSS conflict** | All pages                     | `head.html` load order                           | `mobile-emergency-fix.css` loaded **twice** (lines 19 and 127). `root-vars.css` loaded AFTER modern design system — tokens may be undefined when first consumed                                                             | Remove duplicate; move `root-vars.css` before all component CSS                 |
| 16  | **Nav behavior** | Mobile menu                   | `unified-navigation.js`                          | Targets `.mobile-nav__toggle` — **this class doesn't exist** in `ts-navigation.html`. Dead code conflicting with working `navigation.js`                                                                                    | Remove `unified-navigation.js` from scripts.html or fix selectors               |
| 17  | **Contrast**     | Footer                        | `.footer-list a`                                 | Likely inherits `#fff` but many footer links need to contrast against gradients. Link hover state may be invisible if gold-on-dark                                                                                          | Ensure `:hover` uses `--tiller-color-gold-light: #f2d75c`                       |
| 18  | **Button**       | Contact form                  | `button[type="submit"]`                          | May not have `:disabled` styling — users can submit empty forms with no visual feedback                                                                                                                                     | Add disabled state with reduced opacity                                         |
| 19  | **Spacing**      | Cards on mobile               | `.section-card, .service-card`                   | Cards may have inconsistent padding and margin collapse at narrow widths                                                                                                                                                    | Normalize with `--tiller-spacing-md` and `gap` instead of `margin`              |
| 20  | **Contrast**     | Tools SPA                     | `.app-bottom-nav__link[aria-current="page"]`     | Active state uses `var(--app-primary)` — undefined fallback. Active link **looks identical to inactive**                                                                                                                    | Add explicit active styling with gold/emerald highlight                         |

---

## 🚨 CRITICAL ISSUES IDENTIFIED

### Priority 1: Bottom Navigation Bar (BROKEN)

- **Location:** `tools.html` (lines 420-449)
- **Issue:** Mobile bottom nav not functioning
- **CSS Files:** `mobile-app.css`, `mobile-base.css`, `footer.css`
- **Impact:** Users cannot navigate on mobile devices

### Priority 2: Accessibility Violations (WCAG AAA)

- **Source:** `contrast-audit-report.json` - 4 failures, 19 warnings
- **Issues:**
  - Primary teal-700 (#078930) on cream-100 (#f9f7f4): 4.24 ratio (FAIL)
  - Multiple color combinations below 7:1 (AAA standard)
  - Text contrast issues on gradient backgrounds
  - Insufficient focus indicators

### Priority 3: Style Conflicts & Broken Buttons

- **CSS Files:** 94+ CSS files with potential conflicts
- **Problem Areas:**
  - Duplicate selectors across `main.css`, `modern.css`, `ux-enhancements.css`
  - Z-index conflicts in navigation layers
  - Button hover states not working
  - Form input styling inconsistent

### Priority 4: Text Readability

- **Issues:**
  - Font sizes too small on mobile (<16px)
  - Insufficient line-height (below 1.5)
  - Poor color contrast in footer
  - Truncated text in responsive layouts

### Priority 5: Spacing Problems

- **Areas:**
  - Inconsistent padding in cards/sections
  - Margins collapsing unexpectedly
  - Mobile viewport spacing issues
  - Touch target sizes below 44x44px

---

## 🛠️ REQUIRED ACTIONS

### Phase 1: Environment Setup & Dependencies

#### 1.1 Install Core Dependencies

```powershell
# Navigate to project root
cd c:\web-dev\github-repos\TillerPro

# Install all package.json dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps

# Install Ruby/Jekyll dependencies (if not present)
bundle install

# Verify installations
npm list --depth=0
playwright --version
bundle --version
```

#### 1.2 Install Recommended Dependencies

```powershell
# Accessibility testing
npm install --save-dev @axe-core/playwright pa11y-ci lighthouse

# CSS analysis
npm install --save-dev stylelint stylelint-config-standard prettier

# Testing utilities
npm install --save-dev @playwright/test vitest jsdom

# Performance monitoring
npm install --save-dev web-vitals workbox-cli

# Security auditing
npm install --save-dev npm-audit-html snyk
```

#### 1.3 Update Existing Dependencies

```powershell
# Check for outdated packages
npm outdated

# Update to latest compatible versions
npm update

# Audit for vulnerabilities
npm audit fix
```

---

### Phase 2: Diagnostic Scans

#### 2.1 Run Playwright Navigation Tests

```powershell
# Test all navigation on desktop
npm run test:nav

# Test mobile navigation specifically
npm run test:nav:mobile

# Debug mode to see issues visually
npm run test:nav:debug

# Test mobile bottom nav (create new test if needed)
npx playwright test tests/mobile-nav.spec.js --headed
```

#### 2.2 Accessibility Audits

```powershell
# Run pa11y-ci for WCAG compliance
npm run check:a11y

# Generate Lighthouse accessibility report
npm run lighthouse:local

# Axe accessibility scan (create script)
npx playwright test tests/accessibility.spec.js
```

#### 2.3 CSS Analysis

```powershell
# Lint all CSS files
npm run lint:css

# Find unused CSS
npm run unused:css

# Analyze critical CSS
npm run critical:css
```

#### 2.4 Comprehensive Error Scan

```powershell
# Quick UX error check
npm run check:ux

# Validate HTML structure
npm run validate:html

# Check for broken links
npm run validate:links
```

---

### Phase 3: Bottom Navigation Bar Fix

#### 3.1 Analyze Current Implementation

**File:** `tools.html` (lines 420-449)

**Current Structure:**

```html
<nav
  class="app-bottom-nav bottom-nav"
  id="app-bottom-nav"
  aria-label="Mobile navigation"
  role="navigation"
>
  <a href="#/dashboard" class="app-bottom-nav__link bottom-nav__link" data-route="dashboard">
    <!-- Dashboard link -->
  </a>
  <!-- More links -->
  <a href="#/a11y" class="app-bottom-nav__link bottom-nav__link a11y-nav-btn">
    <!-- Accessibility button -->
  </a>
</nav>
```

#### 3.2 Identify CSS Files

- `assets/css/mobile-app.css` - App-specific mobile styles
- `assets/css/mobile-base.css` - Base mobile utilities
- `assets/css/footer.css` - Footer/bottom nav styles

#### 3.3 Common Issues to Check

1. **Z-index conflicts:** Ensure bottom nav is above content
2. **Position fixed:** Verify `position: fixed; bottom: 0;` is set
3. **Width:** Should span `width: 100%; max-width: 100vw;`
4. **Touch targets:** Links should be ≥44px height
5. **Active states:** `aria-current="page"` should have visual indicator
6. **JavaScript:** Check if routing logic is working

#### 3.4 Fix Strategy

```javascript
// 1. Read mobile-app.css and mobile-base.css
// 2. Search for .app-bottom-nav, .bottom-nav selectors
// 3. Verify:
//    - z-index: 1000 or higher
//    - position: fixed
//    - bottom: 0
//    - display: flex/grid
//    - background: solid color (not transparent)
// 4. Add missing hover/focus states
// 5. Test touch targets (min 44x44px)
// 6. Verify JavaScript routing in assets/js/
```

---

### Phase 4: WCAG AAA Contrast Fixes

#### 4.1 Review Contrast Audit Report

**File:** `contrast-audit-report.json`

**Failed Combinations:**

1. **Primary on Cream:** teal-700 (#078930) on cream-100 (#f9f7f4) = 4.24:1 ❌
   - **Fix:** Use teal-800 (#066b2d) or darker
   - **Location:** Search for `background.*cream` and `color.*teal-700`

2. **Text on gradients:** Various hero sections
   - **Fix:** Add semi-transparent overlays
   - **CSS:** `.hero::before { background: rgba(0,0,0,0.5); }`

#### 4.2 Color System Adjustments

**File:** `assets/css/root-vars.css` or `design-tokens.css`

**Action:**

```css
/* Update CSS variables to meet WCAG AAA (7:1 ratio) */
:root {
  /* Replace low-contrast combinations */
  --color-primary-on-cream: #066b2d; /* teal-800, not teal-700 */
  --color-text-body: #1a1a1a; /* Ensure 7:1 on white */
  --color-text-muted: #4a4a4a; /* Minimum 7:1 contrast */

  /* Add overlays for gradients */
  --overlay-text-protection: rgba(0, 0, 0, 0.6);
}
```

#### 4.3 Systematic Replacement

Use Playwright script to scan and report all color usage:

```javascript
// tests/contrast-scan.spec.js
import { test } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('Scan all pages for contrast violations', async ({ page }) => {
  const pages = [
    '/',
    '/services.html',
    '/products.html',
    '/tools.html',
    // Add all pages
  ];

  for (const url of pages) {
    await page.goto(url);
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  }
});
```

---

### Phase 5: Button & Interactive Element Fixes

#### 5.1 Identify All Buttons

```powershell
# Search for button elements and classes
npx playwright test tests/button-audit.spec.js
```

#### 5.2 Button Issues Checklist

- [ ] **Hover states:** All buttons have `:hover` styles
- [ ] **Focus indicators:** 4px outline, 7:1 contrast
- [ ] **Active states:** `:active` provides feedback
- [ ] **Disabled states:** Visually distinct, non-interactive
- [ ] **Touch targets:** 44x44px minimum
- [ ] **Loading states:** Spinner or visual feedback
- [ ] **ARIA labels:** All icon-only buttons have `aria-label`

#### 5.3 Standard Button Styles

**File:** `assets/css/buttons.css` (create if needed)

```css
/* Base button reset */
.btn,
button,
[role='button'] {
  /* Reset */
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  cursor: pointer;

  /* Minimum requirements */
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;

  /* Typography */
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;

  /* Accessibility */
  transition: all 0.2s ease;
}

/* Focus indicator (WCAG AAA) */
.btn:focus,
button:focus,
[role='button']:focus {
  outline: 4px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

/* Hover state */
.btn:hover,
button:hover,
[role='button']:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Active state */
.btn:active,
button:active,
[role='button']:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Disabled state */
.btn:disabled,
button:disabled,
[role='button']:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

### Phase 6: Typography & Readability

#### 6.1 Base Typography Standards

**File:** `assets/css/typography.css` or update `root-vars.css`

```css
:root {
  /* Font sizes (mobile-first) */
  --font-size-base: 16px; /* Never below 16px on mobile */
  --font-size-small: 14px;
  --font-size-large: 18px;
  --font-size-h1: 32px;
  --font-size-h2: 28px;
  --font-size-h3: 24px;
  --font-size-h4: 20px;

  /* Line heights (WCAG 1.5+ for body) */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-loose: 1.75;

  /* Font weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}

/* Body text */
body {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-body);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Headings */
h1,
h2,
h3,
h4,
h5,
h6 {
  line-height: var(--line-height-tight);
  font-weight: var(--font-weight-bold);
  margin-bottom: 0.5em;
  color: var(--color-text-heading);
}

/* Paragraphs */
p {
  margin-bottom: 1em;
  max-width: 65ch; /* Optimal line length */
}

/* Links */
a {
  color: var(--color-link);
  text-decoration: underline;
  text-underline-offset: 2px;
}

a:hover {
  color: var(--color-link-hover);
  text-decoration-thickness: 2px;
}

/* Focus */
a:focus {
  outline: 4px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: 2px;
}
```

#### 6.2 Responsive Typography

```css
/* Tablet */
@media (min-width: 768px) {
  :root {
    --font-size-base: 18px;
    --font-size-h1: 48px;
    --font-size-h2: 36px;
    --font-size-h3: 28px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  :root {
    --font-size-base: 18px;
    --font-size-h1: 56px;
    --font-size-h2: 42px;
    --font-size-h3: 32px;
  }
}
```

---

### Phase 7: Spacing System

#### 7.1 Establish Spacing Scale

**File:** `assets/css/spacing.css` or update `root-vars.css`

```css
:root {
  /* Spacing scale (8px base) */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  --space-10: 128px;
}

/* Utility classes */
.mt-1 {
  margin-top: var(--space-1);
}
.mt-2 {
  margin-top: var(--space-2);
}
/* ... continue for all directions and sizes */

/* Section spacing */
section {
  padding-block: var(--space-8);
}

@media (min-width: 768px) {
  section {
    padding-block: var(--space-9);
  }
}

/* Container spacing */
.container {
  padding-inline: var(--space-4);
  max-width: 1280px;
  margin-inline: auto;
}

@media (min-width: 768px) {
  .container {
    padding-inline: var(--space-6);
  }
}
```

#### 7.2 Touch Target Spacing

```css
/* Ensure 44x44px minimum touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-3) var(--space-4);
}

/* Spacing between interactive elements */
.nav-links > * + * {
  margin-inline-start: var(--space-4);
}

/* Mobile: Stack with spacing */
@media (max-width: 767px) {
  .nav-links {
    flex-direction: column;
    gap: var(--space-3);
  }
}
```

---

### Phase 8: Comprehensive Testing

#### 8.1 Create New Playwright Tests

**File:** `tests/accessibility.spec.js`

```javascript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Home page should have no detectable a11y violations', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('All navigation links should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('Color contrast should meet WCAG AAA', async ({ page }) => {
    await page.goto('/');
    const scanResults = await new AxeBuilder({ page }).withTags(['wcag2aaa']).analyze();

    const contrastViolations = scanResults.violations.filter(
      v => v.id === 'color-contrast-enhanced'
    );
    expect(contrastViolations).toEqual([]);
  });
});
```

**File:** `tests/mobile-bottom-nav.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Mobile Bottom Navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12

  test('Bottom nav should be visible and functional', async ({ page }) => {
    await page.goto('/tools.html');

    const bottomNav = page.locator('#app-bottom-nav');
    await expect(bottomNav).toBeVisible();

    // Check position
    const box = await bottomNav.boundingBox();
    expect(box.y).toBeGreaterThan(700); // Should be near bottom
  });

  test('All bottom nav links should be clickable', async ({ page }) => {
    await page.goto('/tools.html');

    const links = page.locator('.bottom-nav__link');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(links.nth(i)).toBeVisible();
      await expect(links.nth(i)).toBeEnabled();
    }
  });

  test('Active route should be highlighted', async ({ page }) => {
    await page.goto('/tools.html#/dashboard');

    const activeLink = page.locator('[aria-current="page"]');
    await expect(activeLink).toHaveCount(1);

    // Visual indicator check
    const bgColor = await activeLink.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
  });

  test('Touch targets should be at least 44x44px', async ({ page }) => {
    await page.goto('/tools.html');

    const links = page.locator('.bottom-nav__link');
    for (let i = 0; i < (await links.count()); i++) {
      const box = await links.nth(i).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });
});
```

**File:** `tests/buttons.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Button Functionality', () => {
  test('All buttons should have visible text or aria-label', async ({ page }) => {
    await page.goto('/');

    const buttons = await page.locator('button, [role="button"], .btn').all();
    for (const button of buttons) {
      const text = await button.innerText();
      const ariaLabel = await button.getAttribute('aria-label');
      const hasContent = text.trim().length > 0 || ariaLabel;
      expect(hasContent).toBe(true);
    }
  });

  test('Buttons should have hover states', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('button').first();

    const beforeHover = await button.evaluate(el => window.getComputedStyle(el).backgroundColor);

    await button.hover();

    const afterHover = await button.evaluate(el => window.getComputedStyle(el).backgroundColor);

    // At least one property should change on hover
    expect(beforeHover).not.toEqual(afterHover);
  });

  test('Disabled buttons should not be clickable', async ({ page }) => {
    await page.goto('/contact.html');
    await page.locator('button[type="submit"]').evaluate(btn => (btn.disabled = true));

    const disabled = page.locator('button[disabled]').first();
    await expect(disabled).toBeDisabled();
  });
});
```

#### 8.2 Run All Tests

```powershell
# Run full test suite
npm test

# Run accessibility tests
npx playwright test tests/accessibility.spec.js

# Run mobile navigation tests
npx playwright test tests/mobile-bottom-nav.spec.js

# Run button tests
npx playwright test tests/buttons.spec.js

# Generate HTML report
npx playwright show-report
```

---

### Phase 9: CSS Optimization & Cleanup

#### 9.1 Consolidate Duplicate Styles

```powershell
# Find duplicate CSS selectors
npx css-purge -i assets/css -o assets/css/purged

# Analyze CSS specificity conflicts
npx csscss assets/css

# Remove unused CSS
npm run unused:css
```

#### 9.2 Establish CSS Architecture

```
assets/css/
├── 1-tokens/
│   ├── root-vars.css (colors, spacing, typography)
│   └── design-tokens.css
├── 2-base/
│   ├── reset.css
│   ├── typography.css
│   └── accessibility.css
├── 3-layout/
│   ├── grid.css
│   ├── header.css
│   └── footer.css
├── 4-components/
│   ├── buttons.css
│   ├── forms.css
│   ├── cards.css
│   └── navigation.css
├── 5-utilities/
│   ├── spacing.css
│   ├── colors.css
│   └── responsive.css
└── main.css (imports all in order)
```

#### 9.3 Load Order

**File:** `_includes/layout/head.html`

```html
<!-- CSS Load Order: Tokens → Base → Layout → Components → Utilities -->
<link rel="stylesheet" href="/assets/css/1-tokens/root-vars.css" />
<link rel="stylesheet" href="/assets/css/2-base/reset.css" />
<link rel="stylesheet" href="/assets/css/2-base/typography.css" />
<link rel="stylesheet" href="/assets/css/2-base/accessibility.css" />
<link rel="stylesheet" href="/assets/css/3-layout/grid.css" />
<link rel="stylesheet" href="/assets/css/3-layout/header.css" />
<link rel="stylesheet" href="/assets/css/3-layout/footer.css" />
<link rel="stylesheet" href="/assets/css/4-components/buttons.css" />
<link rel="stylesheet" href="/assets/css/4-components/forms.css" />
<link rel="stylesheet" href="/assets/css/4-components/navigation.css" />
<link rel="stylesheet" href="/assets/css/5-utilities/spacing.css" />
<link rel="stylesheet" href="/assets/css/5-utilities/colors.css" />
<link rel="stylesheet" href="/assets/css/5-utilities/responsive.css" />
```

---

### Phase 10: Performance Optimization

#### 10.1 Critical CSS Extraction

```powershell
# Extract critical CSS for above-the-fold content
npm run critical:css

# Inline critical CSS in <head>
npm run critical:inline
```

#### 10.2 Asset Optimization

```powershell
# Minify all CSS
npm run minify:css

# Minify all JavaScript
npm run minify:js

# Optimize all images
npm run images:optimize

# Generate service worker
npm run sw:generate
```

#### 10.3 Performance Testing

```powershell
# Run Lighthouse audit
npm run lighthouse:local

# Check Core Web Vitals
npm run perf:vitals

# Generate performance report
npm run perf:report
```

---

### Phase 11: Documentation & Validation

#### 11.1 Generate Change Log

**File:** `OPTIMIZATION-CHANGELOG.md`

```markdown
# TillerPro Optimization Changelog

## Date: [Current Date]

## Operator: Claude Opus 0.6

### Summary

Complete optimization of TillerPro website for accessibility, usability, and performance.

### Changes Made

#### 1. Bottom Navigation Bar

- Fixed positioning and z-index issues
- Added proper focus/hover states
- Ensured 44x44px touch targets
- Files modified:
  - `assets/css/mobile-app.css`
  - `assets/css/mobile-base.css`
  - `tools.html`

#### 2. WCAG AAA Compliance

- Resolved all contrast violations
- Updated color system in `root-vars.css`
- Added text overlays for gradients
- Compliance rate: [X%]

#### 3. Button Fixes

- Standardized all button styles
- Added hover/focus/active states
- Ensured ARIA labels on icon buttons
- Files: `assets/css/buttons.css`

#### 4. Typography

- Enforced 16px minimum on mobile
- Set line-height to 1.5 for body text
- Optimized heading hierarchy
- Files: `assets/css/typography.css`

#### 5. Spacing System

- Established 8px-based scale
- Added utility classes
- Fixed margin collapse issues
- Files: `assets/css/spacing.css`

### Test Results

- Playwright tests: [X/X passing]
- Accessibility score: [XX/100]
- Lighthouse score: [XX/100]
- WCAG compliance: [AAA/AA/A]

### Dependencies Installed

- [@axe-core/playwright]
- [List all]

### Breaking Changes

- [None/List any]

### Known Issues

- [List remaining issues]

### Next Steps

- [Recommendations]
```

#### 11.2 Update README.md

Add a section about accessibility and testing to main README.

#### 11.3 Final Validation

```powershell
# Run all linters
npm run lint

# Run all tests
npm test

# Validate HTML
npm run validate:html

# Check accessibility
npm run check:a11y

# Security audit
npm run security:audit

# Build production version
npm run build:prod
```

---

## 📦 COMPLETE DEPENDENCY LIST

### Core Dependencies (Already in package.json)

```json
{
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "autoprefixer": "^10.4.20",
    "clean-css-cli": "^5.6.3",
    "eslint": "latest",
    "prettier": "latest",
    "stylelint": "latest"
  }
}
```

### Recommended Additions

```powershell
npm install --save-dev @axe-core/playwright
npm install --save-dev pa11y-ci
npm install --save-dev lighthouse
npm install --save-dev csscss
npm install --save-dev css-purge
npm install --save-dev html-validate
npm install --save-dev npm-audit-html
npm install --save-dev webpack-bundle-analyzer
npm install --save-dev vitest
npm install --save-dev jsdom
```

---

## 🎓 GOVERNANCE & COMPLIANCE

### AI_IMPORTANT.md Requirements

- **Authority:** All outputs must establish technical authority
- **Accuracy:** Silence preferred over misinformation
- **Testing:** All changes must be validated
- **Documentation:** Comprehensive change logs required

### Code Review Checklist

- [ ] WCAG AAA compliance verified
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness confirmed
- [ ] Performance metrics meet targets
- [ ] All Playwright tests passing
- [ ] Documentation updated
- [ ] Change log generated

---

## 🚀 EXECUTION ORDER

### Day 1: Setup & Diagnosis

1. Install all dependencies
2. Run existing tests to establish baseline
3. Run accessibility audits
4. Document all issues found

### Day 2: Critical Fixes

1. Fix bottom navigation bar
2. Resolve WCAG contrast violations
3. Test fixes with Playwright

### Day 3: Systematic Improvements

1. Fix all buttons
2. Optimize typography
3. Implement spacing system

### Day 4: Testing & Validation

1. Run comprehensive test suite
2. Fix any regressions
3. Performance optimization

### Day 5: Documentation & Polish

1. Generate change logs
2. Update documentation
3. Final validation
4. Deploy to staging

---

## 📞 SUPPORT & REFERENCES

### Key Files to Review

- `AI_IMPORTANT.md` - Governance framework
- `contrast-audit-report.json` - Accessibility violations
- `package.json` - Build scripts and dependencies
- `playwright.config.js` - Test configuration

### Testing Commands Quick Reference

```powershell
npm test                    # Run all tests
npm run test:nav           # Navigation tests
npm run test:nav:mobile    # Mobile navigation
npm run check:a11y         # Accessibility audit
npm run lighthouse:local   # Performance audit
npm run lint               # Code quality check
npm run build:prod         # Production build
```

### Success Metrics

- ✅ WCAG AAA compliance: 100%
- ✅ Lighthouse score: 95+
- ✅ All Playwright tests: Passing
- ✅ Mobile navigation: Fully functional
- ✅ Touch targets: ≥44x44px
- ✅ Color contrast: ≥7:1
- ✅ Load time: <2 seconds
- ✅ Zero broken links
- ✅ Zero console errors

---

## 🎯 INSPIRATION GOAL

By completing this optimization, TillerPro will become:

1. **Most accessible** contractor site in New Jersey
2. **Highest performing** in speed and UX
3. **Industry reference** for other contractors
4. **Client-focused** with exceptional usability
5. **Technically authoritative** in tile/waterproofing space

---

**End of Guide**

_Claude Opus 0.6: Please follow this guide systematically, document all changes, and validate each phase with tests before proceeding. Your mission is to make TillerPro the best contractor website in South Jersey._

**START WITH:** Phase 1 (Dependencies) and Phase 2 (Diagnostics)
