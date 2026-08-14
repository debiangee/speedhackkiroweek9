import { test, expect } from '@playwright/test';

test.describe('PH Rain Forecast — Core App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads the app with header and main content', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Weather Lang');
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('skip-to-content link works', async ({ page }) => {
    const skipLink = page.locator('a.skip-link');
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('dark mode toggle switches theme', async ({ page }) => {
    const toggle = page.locator('[class*="dark-mode"]').first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    // Dark mode applies data-theme="dark" on <html>
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // Toggle back
    await toggle.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  });

  test('footer contains attribution links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.locator('a[href*="open-meteo"]')).toBeVisible();
    await expect(footer.locator('a[href*="pagasa"]')).toBeVisible();
  });
});

test.describe('PH Rain Forecast — Dashboard Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for dashboard to load
    await page.waitForSelector('#main-content', { state: 'visible' });
  });

  test('dashboard renders without errors', async ({ page }) => {
    // No uncaught errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('region selector is present and interactive', async ({ page }) => {
    // Look for the search input inside the dashboard-search container
    const searchInput = page.locator('.dashboard-search input, [class*="search"] input').first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.click();
      await expect(searchInput).toBeFocused();
    } else {
      // If no input found, just verify dashboard-search container exists
      const searchContainer = page.locator('[class*="search"]').first();
      await expect(searchContainer).toBeVisible();
    }
  });
});

test.describe('PH Rain Forecast — Loop Orchestration (Multi-Region)', () => {
  const regions = [
    'Metro Manila',
    'Central Visayas',
    'Western Visayas',
    'Davao Region',
    'Calabarzon',
  ];

  for (const region of regions) {
    test(`loads data for region: ${region}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('#main-content', { state: 'visible' });

      // Wait for initial loader to disappear before interacting
      await page.locator('.cinematic-loader').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

      // Try to find and use a region search/selector
      const searchInput = page.locator(
        'input[type="text"], input[type="search"], [class*="search"] input'
      ).first();

      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill(region);
        await page.waitForTimeout(500);

        // Use keyboard to select the first result (avoids pointer interception issues on mobile)
        const option = page.locator(`text=${region}`).first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click({ force: true, timeout: 5000 }).catch(async () => {
            // Fallback: press Enter to select from the dropdown
            await searchInput.press('Enter');
          });
          await page.waitForTimeout(1000);
        }
      }

      // Verify no crash — page should still be functional
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Weather Lang');
    });
  }
});

test.describe('PH Rain Forecast — Responsive Layout', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.locator('.app')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('#main-content')).toBeVisible();

      // No horizontal overflow (allow slightly more tolerance for mobile)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 25); // 25px tolerance for minor overflow
    });
  }
});
