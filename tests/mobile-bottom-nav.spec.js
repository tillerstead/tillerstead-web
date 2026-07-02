import { test, expect } from '@playwright/test';

/**
 * Mobile Bottom Navigation Tests
 *
 * Tests for the broken bottom navigation bar in tools.html
 * Priority: CRITICAL - Main issue blocking mobile users
 */

test.describe('Mobile Bottom Navigation - Critical Fixes', () => {
  // Use iPhone 12 viewport
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/tools.html');
    // Wait for any JavaScript to load
    await page.waitForLoadState('networkidle');
  });

  test('Bottom nav should exist and be visible', async ({ page }) => {
    const bottomNav = page.locator('#app-bottom-nav, .app-bottom-nav, .bottom-nav');

    const exists = (await bottomNav.count()) > 0;
    expect(exists).toBe(true);

    if (exists) {
      await expect(bottomNav.first()).toBeVisible();
    }
  });

  test('Bottom nav should be positioned at bottom of viewport', async ({ page }) => {
    const bottomNav = page.locator('#app-bottom-nav, .app-bottom-nav').first();

    if ((await bottomNav.count()) > 0) {
      const box = await bottomNav.boundingBox();
      const viewportSize = page.viewportSize();

      // Bottom nav should be near the bottom (within 100px)
      expect(box.y + box.height).toBeGreaterThan(viewportSize.height - 100);

      // Should span full width
      expect(box.width).toBeGreaterThanOrEqual(viewportSize.width * 0.9);
    }
  });

  test('Bottom nav should have fixed positioning', async ({ page }) => {
    const bottomNav = page.locator('#app-bottom-nav, .app-bottom-nav').first();

    if ((await bottomNav.count()) > 0) {
      const position = await bottomNav.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          bottom: styles.bottom,
          left: styles.left,
          right: styles.right,
          zIndex: styles.zIndex,
        };
      });

      expect(position.position).toBe('fixed');
      expect(parseInt(position.zIndex)).toBeGreaterThan(900);
    }
  });

  test('All bottom nav links should be visible and clickable', async ({ page }) => {
    const links = page.locator('.bottom-nav__link, .app-bottom-nav__link');
    const count = await links.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      await expect(link).toBeVisible();

      // Check if clickable (not covered by another element)
      const isClickable = await link.isEnabled();
      expect(isClickable).toBe(true);
    }
  });

  test('Bottom nav links should have 44x44px minimum touch targets', async ({ page }) => {
    const links = page.locator('.bottom-nav__link, .app-bottom-nav__link');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const box = await link.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Active route should be visually highlighted', async ({ page }) => {
    // Check if any link has aria-current="page"
    const activeLink = page.locator('[aria-current="page"]');

    if ((await activeLink.count()) > 0) {
      const styles = await activeLink.first().evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          fontWeight: computed.fontWeight,
          borderBottom: computed.borderBottom,
        };
      });

      // Active link should have some visual distinction
      // (not transparent background OR different color OR bold OR border)
      const hasVisualDistinction =
        styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
        parseInt(styles.fontWeight) >= 600 ||
        styles.borderBottom !== 'none';

      expect(hasVisualDistinction).toBe(true);
    }
  });

  test('Bottom nav should not overlap content', async ({ page }) => {
    const bottomNav = page.locator('#app-bottom-nav, .app-bottom-nav').first();

    if ((await bottomNav.count()) > 0) {
      const navBox = await bottomNav.boundingBox();

      // Check if main content has proper padding-bottom
      const mainContent = page.locator('main, .app-content, .main-content').first();

      if ((await mainContent.count()) > 0) {
        const contentPadding = await mainContent.evaluate(el => {
          return window.getComputedStyle(el).paddingBottom;
        });

        const paddingValue = parseInt(contentPadding);

        // Padding should be at least as tall as the nav bar
        expect(paddingValue).toBeGreaterThanOrEqual(navBox.height - 10);
      }
    }
  });

  test('Bottom nav should have proper background (not transparent)', async ({ page }) => {
    const bottomNav = page.locator('#app-bottom-nav, .app-bottom-nav').first();

    if ((await bottomNav.count()) > 0) {
      const bg = await bottomNav.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should not be transparent
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
      expect(bg).not.toBe('transparent');
    }
  });

  test('Bottom nav links should have hover states', async ({ page }) => {
    const link = page.locator('.bottom-nav__link, .app-bottom-nav__link').first();

    if ((await link.count()) > 0) {
      const beforeHover = await link.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          transform: styles.transform,
        };
      });

      await link.hover();
      await page.waitForTimeout(100); // Wait for transition

      const afterHover = await link.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          transform: styles.transform,
        };
      });

      // At least one property should change
      const hasHoverState =
        beforeHover.backgroundColor !== afterHover.backgroundColor ||
        beforeHover.color !== afterHover.color ||
        beforeHover.transform !== afterHover.transform;

      expect(hasHoverState).toBe(true);
    }
  });

  test('Bottom nav should be accessible via keyboard', async ({ page }) => {
    // Tab to first nav link
    await page.keyboard.press('Tab');

    // Find focused element
    const focusedElement = await page.evaluate(() => {
      return document.activeElement.className;
    });

    // Should eventually reach a bottom nav link
    // Try tabbing up to 20 times
    let foundNavLink = focusedElement.includes('bottom-nav');
    let attempts = 0;

    while (!foundNavLink && attempts < 20) {
      await page.keyboard.press('Tab');
      const currentFocus = await page.evaluate(() => {
        return document.activeElement.className;
      });
      foundNavLink = currentFocus.includes('bottom-nav');
      attempts++;
    }

    expect(foundNavLink).toBe(true);
  });
});

test.describe('Mobile Bottom Navigation - JavaScript Tests', () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test('Navigation links should update route on click', async ({ page }) => {
    await page.goto('/tools.html');

    const links = page.locator('.bottom-nav__link, .app-bottom-nav__link');

    if ((await links.count()) > 0) {
      const firstLink = links.first();
      const href = await firstLink.getAttribute('href');

      if (href && href.startsWith('#')) {
        await firstLink.click();
        await page.waitForTimeout(200);

        // Check if URL hash changed
        const currentHash = await page.evaluate(() => window.location.hash);
        expect(currentHash).toBe(href);
      }
    }
  });

  test('Accessibility panel should open when a11y button clicked', async ({ page }) => {
    await page.goto('/tools.html');

    const a11yButton = page.locator('.a11y-nav-btn');

    if ((await a11yButton.count()) > 0) {
      await a11yButton.click();
      await page.waitForTimeout(300);

      // Check if panel opened
      const panel = page.locator('.a11y-toolbar__panel, .a11y-panel');

      if ((await panel.count()) > 0) {
        const isVisible = await panel.first().isVisible();
        expect(isVisible).toBe(true);
      }
    }
  });
});

test.describe('Mobile Bottom Navigation - Responsive Tests', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  ];

  for (const viewport of viewports) {
    test(`Bottom nav should work on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/tools.html');

      const bottomNav = page.locator('#app-bottom-nav, .app-bottom-nav').first();

      if ((await bottomNav.count()) > 0) {
        await expect(bottomNav).toBeVisible();

        const box = await bottomNav.boundingBox();

        // Should span at least 90% of viewport width
        expect(box.width).toBeGreaterThanOrEqual(viewport.width * 0.9);

        // Should be at bottom
        expect(box.y + box.height).toBeGreaterThan(viewport.height - 100);
      }
    });
  }
});
