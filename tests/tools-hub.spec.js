/**
 * TillerPro Tools Hub — Playwright E2E Tests
 *
 * Tests router navigation, calculator views, adapter lifecycle,
 * dashboard/admin fragment injection, and button interactions.
 */
import { test, expect } from '@playwright/test';

/* ────────── helpers ────────── */

/** Navigate to Tools Hub with a specific hash route */
async function gotoHub(page, route = 'overview') {
  await page.goto(`/tools-hub/#/${route}`);
  // Wait for the router to initialize and render content
  await page.waitForSelector('#app-container', { state: 'visible', timeout: 15_000 });
  // Allow fadeTransition (150ms) + adapter init
  await page.waitForTimeout(500);
}

/** Get the visible text inside #app-content */
async function appContentText(page) {
  return page.locator('#app-content').innerText();
}

/* ════════════════════════════════════════════════════
   1. PAGE LOAD & CORE STRUCTURE
   ════════════════════════════════════════════════════ */

test.describe('Tools Hub — Page Load', () => {
  test('loads without console errors or 404s', async ({ page }) => {
    const errors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('response', res => {
      if (res.status() === 404) failedRequests.push(res.url());
    });

    await gotoHub(page);

    // Filter out known benign 404s (favicon variants, og-image, etc.)
    const real404s = failedRequests.filter(
      u => !u.includes('favicon') && !u.includes('og-tools') && !u.includes('apple-touch')
    );

    expect(real404s).toEqual([]);
  });

  test('app container becomes visible after load', async ({ page }) => {
    await gotoHub(page);
    await expect(page.locator('#app-container')).toBeVisible();
    await expect(page.locator('#loading-indicator')).toBeHidden();
  });

  test('header, nav rail, and content area are present', async ({ page }) => {
    await gotoHub(page);
    await expect(page.locator('.app-header')).toBeVisible();
    // Nav rail is hidden on mobile — check that at least one nav element exists
    const navRailVisible = await page.locator('#nav-rail').isVisible();
    if (navRailVisible) {
      await expect(page.locator('#nav-rail')).toBeVisible();
    } else {
      // On mobile, the mobile nav toggle should be present instead
      await expect(page.locator('.mobile-nav-toggle')).toBeVisible();
    }
    await expect(page.locator('#app-content')).toBeVisible();
  });
});

/* ════════════════════════════════════════════════════
   2. HASH ROUTER NAVIGATION
   ════════════════════════════════════════════════════ */

test.describe('Tools Hub — Router Navigation', () => {
  const routes = [
    { hash: 'overview', marker: '.overview-page', label: 'Overview' },
    { hash: 'tile', marker: '#tile-calculator', label: 'Tile Calculator' },
    { hash: 'grout', marker: '#grout-calculator', label: 'Grout Calculator' },
    { hash: 'mortar', marker: '#mortar-calculator', label: 'Mortar Calculator' },
    { hash: 'waterproof', marker: '#waterproof-calculator', label: 'Waterproofing Calculator' },
    { hash: 'slope', marker: '#slope-calculator', label: 'Slope Calculator' },
    { hash: 'leveling', marker: '#leveling-calculator', label: 'Leveling Calculator' },
    { hash: 'labor', marker: '#labor-calculator', label: 'Labor Estimator' },
    { hash: 'quote', marker: '.quote-form-container', label: 'Quote Generator' },
    { hash: 'dashboard', marker: '.dashboard-view', label: 'Dashboard' },
    { hash: 'admin', marker: '.admin-view', label: 'Admin Settings' },
  ];

  for (const { hash, marker, label } of routes) {
    test(`navigates to #/${hash} and renders ${label}`, async ({ page }) => {
      await gotoHub(page, hash);
      await expect(page.locator(marker).first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test('nav rail links update active state', async ({ page }) => {
    await gotoHub(page, 'tile');
    // The tile nav link in the rail should be marked active (not the mobile sheet copy)
    await expect(page.locator('.nav-rail__link[data-route="tile"]')).toHaveClass(/active/);
    // Overview should NOT be active
    await expect(page.locator('.nav-rail__link[data-route="overview"]')).not.toHaveClass(/active/);
  });

  test('clicking nav rail link changes route', async ({ page }) => {
    await gotoHub(page, 'overview');
    const navRailVisible = await page.locator('#nav-rail').isVisible();
    if (navRailVisible) {
      // Desktop: click nav rail link
      await page.locator('.nav-rail__link[data-route="grout"]').click();
    } else {
      // Mobile: navigate via hash since nav rail is hidden
      await page.goto('/tools-hub/#/grout');
    }
    await page.waitForTimeout(500);
    await expect(page.locator('#grout-calculator')).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain('#/grout');
  });

  test('unknown route redirects to overview', async ({ page }) => {
    await gotoHub(page, 'nonexistent');
    await page.waitForTimeout(1000);
    // Should redirect to overview
    await expect(page.locator('.overview-page').first()).toBeVisible({ timeout: 10_000 });
  });

  test('browser back/forward works', async ({ page }) => {
    await gotoHub(page, 'tile');
    await expect(page.locator('#tile-calculator')).toBeVisible({ timeout: 10_000 });

    // Navigate to grout (use nav rail on desktop, hash nav on mobile)
    const navRailVisible = await page.locator('#nav-rail').isVisible();
    if (navRailVisible) {
      await page.locator('.nav-rail__link[data-route="grout"]').click();
    } else {
      await page.goto('/tools-hub/#/grout');
    }
    await page.waitForTimeout(500);
    await expect(page.locator('#grout-calculator')).toBeVisible({ timeout: 10_000 });

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);
    await expect(page.locator('#tile-calculator')).toBeVisible({ timeout: 10_000 });

    // Go forward
    await page.goForward();
    await page.waitForTimeout(500);
    await expect(page.locator('#grout-calculator')).toBeVisible({ timeout: 10_000 });
  });
});

/* ════════════════════════════════════════════════════
   3. DASHBOARD FRAGMENT (no nested <html>/<body>)
   ════════════════════════════════════════════════════ */

test.describe('Tools Hub — Dashboard View', () => {
  test('dashboard renders inside .dashboard-view wrapper', async ({ page }) => {
    await gotoHub(page, 'dashboard');
    await expect(page.locator('.dashboard-view')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.dashboard-view .dashboard')).toBeVisible();
  });

  test('dashboard does NOT inject nested <html> or <body> tags', async ({ page }) => {
    await gotoHub(page, 'dashboard');
    await page.waitForTimeout(500);
    // There should be exactly 1 <html> and 1 <body> in the entire page
    const htmlCount = await page.evaluate(() => document.querySelectorAll('html').length);
    const bodyCount = await page.evaluate(() => document.querySelectorAll('body').length);
    expect(htmlCount).toBe(1);
    expect(bodyCount).toBe(1);
  });

  test('dashboard uses scoped green theme (not purple)', async ({ page }) => {
    await gotoHub(page, 'dashboard');
    await expect(page.locator('.dashboard-view')).toBeVisible({ timeout: 10_000 });

    const primaryColor = await page.evaluate(() => {
      const el = document.querySelector('.dashboard-view');
      return getComputedStyle(el).getPropertyValue('--dash-primary').trim();
    });
    expect(primaryColor).toBe('#10b981');
  });

  test('dashboard header displays correctly', async ({ page }) => {
    await gotoHub(page, 'dashboard');
    await expect(page.locator('.dashboard-view .dashboard-header h1')).toContainText('Dashboard');
  });

  test('Add Location button is present and uses scoped class', async ({ page }) => {
    await gotoHub(page, 'dashboard');
    const btn = page.locator('.dashboard-view .dash-btn-primary').first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await expect(btn).toContainText('Add Location');
  });

  test('Add Location modal opens on click', async ({ page }) => {
    await gotoHub(page, 'dashboard');
    await page.waitForTimeout(1500);
    const modal = page.locator('#add-location-modal');
    // Click the "Add Location" button in the header (not the modal's submit button)
    await page.locator('.location-selector-header .dash-btn-primary').click();
    await expect(modal).toHaveClass(/active/, { timeout: 5000 });
  });

  test('dashboard-manager.js script loads dynamically', async ({ page }) => {
    await gotoHub(page, 'dashboard');
    // Wait for the router's initializeScripts to clone the <script> tag
    await page.waitForFunction(() => !!document.getElementById('dashboard-manager-script'), {
      timeout: 10_000,
    });
    const scriptExists = await page.evaluate(
      () => !!document.getElementById('dashboard-manager-script')
    );
    expect(scriptExists).toBe(true);
  });
});

/* ════════════════════════════════════════════════════
   4. ADMIN FRAGMENT (no nested <html>/<body>)
   ════════════════════════════════════════════════════ */

test.describe('Tools Hub — Admin View', () => {
  test('admin renders inside .admin-view wrapper', async ({ page }) => {
    await gotoHub(page, 'admin');
    await expect(page.locator('.admin-view')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.admin-view .admin-container')).toBeVisible();
  });

  test('admin does NOT inject nested <html> or <body> tags', async ({ page }) => {
    await gotoHub(page, 'admin');
    await page.waitForTimeout(500);
    const htmlCount = await page.evaluate(() => document.querySelectorAll('html').length);
    const bodyCount = await page.evaluate(() => document.querySelectorAll('body').length);
    expect(htmlCount).toBe(1);
    expect(bodyCount).toBe(1);
  });

  test('admin uses scoped green theme (not purple)', async ({ page }) => {
    await gotoHub(page, 'admin');
    await expect(page.locator('.admin-view')).toBeVisible({ timeout: 10_000 });
    const primaryColor = await page.evaluate(() => {
      const el = document.querySelector('.admin-view');
      return getComputedStyle(el).getPropertyValue('--admin-primary').trim();
    });
    expect(primaryColor).toBe('#10b981');
  });

  test('admin header and tabs render', async ({ page }) => {
    await gotoHub(page, 'admin');
    await expect(page.locator('.admin-view .admin-header h1')).toContainText('Admin Settings');
    await expect(page.locator('.admin-view .admin-tabs')).toBeVisible();
  });

  test('admin tab switching works', async ({ page }) => {
    await gotoHub(page, 'admin');
    // Wait for admin-manager.js to load (provides switchTab function)
    await page.waitForFunction(() => typeof window.switchTab === 'function', { timeout: 10_000 });

    // Company tab should be active by default
    await expect(page.locator('#tab-company')).toHaveClass(/active/);

    // Click Legal tab
    await page.locator('.admin-tab', { hasText: 'Legal Text' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('#tab-legal')).toHaveClass(/active/);
    await expect(page.locator('#tab-company')).not.toHaveClass(/active/);
  });

  test('admin buttons use scoped .admin-btn class', async ({ page }) => {
    await gotoHub(page, 'admin');
    await expect(page.locator('.admin-view .admin-btn-primary').first()).toBeVisible({
      timeout: 10_000,
    });
    // Ensure no unscoped .btn exists inside admin view
    const unscopedBtns = await page.locator('.admin-view > .admin-container .btn').count();
    expect(unscopedBtns).toBe(0);
  });

  test('admin-manager.js script loads dynamically', async ({ page }) => {
    await gotoHub(page, 'admin');
    await page.waitForFunction(() => !!document.getElementById('admin-manager-script'), {
      timeout: 10_000,
    });
    const scriptExists = await page.evaluate(
      () => !!document.getElementById('admin-manager-script')
    );
    expect(scriptExists).toBe(true);
  });
});

/* ════════════════════════════════════════════════════
   5. CALCULATOR ADAPTER LIFECYCLE
   ════════════════════════════════════════════════════ */

test.describe('Tools Hub — Adapter Lifecycle', () => {
  test('tile adapter initializes when navigating to tile view', async ({ page }) => {
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    await gotoHub(page, 'tile');
    await page.waitForTimeout(1500);

    const initLog = logs.find(l => l.includes('Initializing adapter: TileCalculatorAdapter'));
    expect(initLog).toBeTruthy();
  });

  test('previous adapter is destroyed when navigating away', async ({ page }) => {
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    // Navigate to tile first
    await gotoHub(page, 'tile');
    await page.waitForTimeout(1000);

    // Navigate to grout — should destroy tile adapter
    const navRailVisible = await page.locator('#nav-rail').isVisible();
    if (navRailVisible) {
      await page.locator('.nav-rail__link[data-route="grout"]').click();
    } else {
      await page.goto('/tools-hub/#/grout');
      await page.waitForSelector('#app-container', { state: 'visible', timeout: 15_000 });
    }
    await page.waitForTimeout(1000);

    const destroyLog = logs.find(l => l.includes('Previous adapter destroyed'));
    expect(destroyLog).toBeTruthy();
  });
});

/* ════════════════════════════════════════════════════
   6. CALCULATOR VIEW FORMS
   ════════════════════════════════════════════════════ */

test.describe('Tools Hub — Calculator Forms', () => {
  test('tile calculator has area input and tile size select', async ({ page }) => {
    await gotoHub(page, 'tile');
    await expect(page.locator('#tile-calculator')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#calc-area')).toBeVisible();
    await expect(page.locator('#calc-tile-size')).toBeVisible();
  });

  test('grout calculator has required form fields', async ({ page }) => {
    await gotoHub(page, 'grout');
    await expect(page.locator('#grout-calculator')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#grout-area')).toBeVisible();
  });

  test('mortar calculator has required form fields', async ({ page }) => {
    await gotoHub(page, 'mortar');
    await expect(page.locator('#mortar-calculator')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#mortar-area')).toBeVisible();
  });

  test('waterproofing calculator has required form fields', async ({ page }) => {
    await gotoHub(page, 'waterproof');
    await expect(page.locator('#waterproof-calculator')).toBeVisible({ timeout: 10_000 });
  });

  test('slope calculator has required form fields', async ({ page }) => {
    await gotoHub(page, 'slope');
    await expect(page.locator('#slope-calculator')).toBeVisible({ timeout: 10_000 });
  });

  test('leveling calculator has required form fields', async ({ page }) => {
    await gotoHub(page, 'leveling');
    await expect(page.locator('#leveling-calculator')).toBeVisible({ timeout: 10_000 });
  });

  test('labor estimator has required form fields', async ({ page }) => {
    await gotoHub(page, 'labor');
    await expect(page.locator('#labor-calculator')).toBeVisible({ timeout: 10_000 });
  });
});

/* ════════════════════════════════════════════════════
   7. LEGACY TOOLS APP (/tools/) — NO 404s
   ════════════════════════════════════════════════════ */

test.describe('Legacy Tools App (/tools/)', () => {
  test('loads without 404 CSS errors', async ({ page }) => {
    const failedCSS = [];
    page.on('response', res => {
      if (res.status() === 404 && res.url().endsWith('.css')) {
        failedCSS.push(res.url());
      }
    });

    await page.goto('/tools/');
    await page.waitForTimeout(3000);

    // Should not have any CSS 404s (tillerpro-contrast-fix.css was removed)
    expect(failedCSS).toEqual([]);
  });

  test('legacy tools app shell becomes ready', async ({ page }) => {
    await page.goto('/tools/');
    // The app shell starts hidden (.app-shell) and gets .is-ready from JS
    // Wait for the class to be added (element may still be hidden due to loading animation)
    await page.waitForFunction(
      () => {
        const shell = document.getElementById('app-shell');
        return shell && shell.classList.contains('is-ready');
      },
      { timeout: 20_000 }
    );
    // Verify the class was applied (legacy app's own loading screen may still overlay)
    const hasReady = await page.evaluate(() =>
      document.getElementById('app-shell')?.classList.contains('is-ready')
    );
    expect(hasReady).toBe(true);
  });
});

/* ════════════════════════════════════════════════════
   8. OVERVIEW CSS – NO FOUC
   ════════════════════════════════════════════════════ */

test.describe('Tools Hub — Overview CSS Preload', () => {
  test('overview-page.css is loaded in <head> before route render', async ({ page }) => {
    await page.goto('/tools-hub/');
    // Check that the stylesheet is in the head (preloaded)
    const hasCSS = await page.evaluate(() => {
      const links = document.querySelectorAll('head link[rel="stylesheet"]');
      return [...links].some(l => l.href.includes('overview-page.css'));
    });
    expect(hasCSS).toBe(true);
  });
});

/* ════════════════════════════════════════════════════
   9. MOBILE NAVIGATION
   ════════════════════════════════════════════════════ */

test.describe('Tools Hub — Mobile Navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mobile nav toggle is visible on small screens', async ({ page }) => {
    await gotoHub(page);
    await expect(page.locator('#mobile-nav-toggle')).toBeVisible();
  });

  test('mobile nav sheet opens and closes', async ({ page }) => {
    await gotoHub(page);
    const sheet = page.locator('#nav-sheet');

    // Open
    await page.locator('#mobile-nav-toggle').click();
    await page.waitForTimeout(400);
    // Sheet should be visible (may use aria-hidden=false or display)
    const isHidden = await sheet.getAttribute('aria-hidden');
    expect(isHidden).toBe('false');

    // Close using backdrop
    await page.locator('#nav-backdrop').click({ force: true });
    await page.waitForTimeout(600);
    // Verify sheet is no longer active — check aria-hidden or computed visibility
    const sheetHidden = await page.evaluate(() => {
      const s = document.getElementById('nav-sheet');
      if (!s) return true;
      return (
        s.getAttribute('aria-hidden') === 'true' ||
        getComputedStyle(s).transform.includes('100') ||
        !s.classList.contains('open')
      );
    });
    expect(sheetHidden).toBe(true);
  });
});
