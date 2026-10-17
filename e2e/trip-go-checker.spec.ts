import {test, expect} from '@playwright/test';
import {prepare} from './fixtures';
test.beforeEach(async ({page}) => { await prepare(page); await page.goto('/'); });
test('same-region city uses destination coordinates and explains suitability', async ({page}) => {
  const requests: string[] = []; page.on('request',r => requests.push(r.url()));
  await page.locator('#tgc-region').selectOption('NCR');
  await page.locator('#tgc-city').selectOption('Makati');
  await expect(page.locator('.tgc-verdict')).toBeVisible();
  await expect(page.locator('.tgc-verdict-summary')).toContainText('not confirmation of road safety');
  expect(requests.some(u => u.includes('latitude=14.5547'))).toBe(true);
  await expect(page.locator('.tgc-day')).toHaveCount(7);
});
test('critical hourly wind overrides an otherwise favorable day', async ({page}) => {
  await page.route('https://api.open-meteo.com/**', async route => {
    const {forecastFixture} = await import('./fixtures'); const data = forecastFixture(route.request().url());
    if (data.hourly.wind_gusts_10m) data.hourly.wind_gusts_10m[14] = 100;
    await route.fulfill({json:data});
  });
  await page.locator('#tgc-region').selectOption('Bicol');
  await expect(page.locator('.tgc-verdict-label')).toHaveText('Consider postponing');
  await expect(page.locator('.tgc-verdict-summary')).toContainText('Strong forecast wind or gusts');
  await expect(page.locator('.tgc-score-value')).toHaveText(/^[0-3]?\d$/);
});
