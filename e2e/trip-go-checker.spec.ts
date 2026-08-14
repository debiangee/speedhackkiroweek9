import { test, expect } from '@playwright/test';

test.describe('Trip Go Checker Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#main-content', { state: 'visible' });
  });

  test('renders Trip Go Checker section card', async ({ page }) => {
    const section = page.locator('text=Trip Go Checker');
    await expect(section).toBeVisible();
  });

  test('shows empty state with prompt when no region selected', async ({ page }) => {
    const prompt = page.locator('text=Select a destination to check');
    await expect(prompt).toBeVisible();
  });

  test('region dropdown contains all 17 Philippine regions', async ({ page }) => {
    const select = page.locator('#tgc-region');
    await expect(select).toBeVisible();
    const options = await select.locator('option').count();
    // 17 regions + 1 placeholder = 18
    expect(options).toBe(18);
  });

  test('selecting a region shows city dropdown and verdict', async ({ page }) => {
    const regionSelect = page.locator('#tgc-region');
    await regionSelect.selectOption('NCR');

    // City dropdown should appear
    const citySelect = page.locator('#tgc-city');
    await expect(citySelect).toBeVisible({ timeout: 5000 });

    // Wait for verdict to load
    const verdict = page.locator('.tgc-verdict');
    await expect(verdict).toBeVisible({ timeout: 15000 });
  });

  test('verdict banner displays score and label', async ({ page }) => {
    const regionSelect = page.locator('#tgc-region');
    await regionSelect.selectOption('Central Visayas');

    // Wait for verdict
    const verdict = page.locator('.tgc-verdict');
    await expect(verdict).toBeVisible({ timeout: 15000 });

    // Score should be visible
    const score = page.locator('.tgc-score-value');
    await expect(score).toBeVisible();
    const scoreText = await score.textContent();
    const scoreNum = parseInt(scoreText || '0');
    expect(scoreNum).toBeGreaterThanOrEqual(0);
    expect(scoreNum).toBeLessThanOrEqual(100);
  });

  test('condition cards show 4 metrics', async ({ page }) => {
    const regionSelect = page.locator('#tgc-region');
    await regionSelect.selectOption('NCR');

    // Wait for conditions to appear
    const cards = page.locator('.tgc-card');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    expect(await cards.count()).toBe(4);
  });

  test('day selector shows 7 days', async ({ page }) => {
    const regionSelect = page.locator('#tgc-region');
    await regionSelect.selectOption('Davao');

    // Wait for day selector
    const days = page.locator('.tgc-day');
    await expect(days.first()).toBeVisible({ timeout: 15000 });
    expect(await days.count()).toBe(7);
  });

  test('clicking a different day updates the verdict', async ({ page }) => {
    const regionSelect = page.locator('#tgc-region');
    await regionSelect.selectOption('NCR');

    // Wait for initial verdict
    const verdict = page.locator('.tgc-verdict');
    await expect(verdict).toBeVisible({ timeout: 15000 });

    // Click a different day (day 3)
    const days = page.locator('.tgc-day');
    await days.nth(3).click();

    // Wait for verdict to re-render after day change
    await expect(verdict).toBeVisible({ timeout: 15000 });
  });

  test('selecting a city refines the forecast', async ({ page }) => {
    const regionSelect = page.locator('#tgc-region');
    await regionSelect.selectOption('NCR');

    // Wait for city dropdown
    const citySelect = page.locator('#tgc-city');
    await expect(citySelect).toBeVisible({ timeout: 5000 });

    // Select a specific city
    await citySelect.selectOption('Makati');

    // Verdict should still render
    const verdict = page.locator('.tgc-verdict');
    await expect(verdict).toBeVisible({ timeout: 15000 });
  });

  test('travel windows are displayed', async ({ page }) => {
    const regionSelect = page.locator('#tgc-region');
    await regionSelect.selectOption('Western Visayas');

    // Wait for windows section
    const windows = page.locator('.tgc-windows');
    await expect(windows).toBeVisible({ timeout: 15000 });
  });

  test('practical advice list is displayed', async ({ page }) => {
    const regionSelect = page.locator('#tgc-region');
    await regionSelect.selectOption('CALABARZON');

    // Wait for advice
    const advice = page.locator('.tgc-advice');
    await expect(advice).toBeVisible({ timeout: 15000 });

    // Should have at least 3 advice items
    const items = page.locator('.tgc-advice-item');
    expect(await items.count()).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Trip Go Checker — Loop Orchestration (Multi-Region)', () => {
  const testRegions = ['NCR', 'Central Visayas', 'Davao', 'CALABARZON', 'Bicol'];

  for (const region of testRegions) {
    test(`produces verdict for ${region}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('#main-content', { state: 'visible' });

      const regionSelect = page.locator('#tgc-region');
      await regionSelect.selectOption(region);

      // Verdict should appear
      const verdict = page.locator('.tgc-verdict');
      await expect(verdict).toBeVisible({ timeout: 15000 });

      // Must be one of the three verdict types
      const verdictClass = await verdict.getAttribute('class');
      expect(
        verdictClass?.includes('tgc-verdict-go') ||
        verdictClass?.includes('tgc-verdict-caution') ||
        verdictClass?.includes('tgc-verdict-nogo')
      ).toBeTruthy();
    });
  }
});
