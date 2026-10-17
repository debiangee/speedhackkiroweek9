import { test, expect } from '@playwright/test';
import { prepare } from './fixtures';
test.beforeEach(async ({page}) => { await prepare(page); });
test('forecast-first overview, official sources and deferred maps', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const calls: string[] = []; page.on('request', r => calls.push(r.url()));
  await page.goto('/');
  await expect(page.locator('.hero-temperature')).toHaveText('27°C');
  const temperatureBox=await page.locator('.hero-temperature').boundingBox();
  expect(temperatureBox!.y+temperatureBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(page.locator('.conditions-primary')).toContainText('2026-10-18 · 12:00 PHT');
  await expect(page.locator('.conditions-primary')).toContainText('NOT AN OBSERVATION');
  await expect(page.locator('.freshness')).toContainText('Open-Meteo');
  await expect(page.getByRole('navigation', {name:'Primary navigation'}).getByRole('link')).toHaveCount(6);
  await expect(page.getByText('This app does not ingest official warnings.',{exact:false})).toBeVisible();
  expect(calls.filter(u => /rainviewer|overpass|arcgisonline|tile.openstreetmap/.test(u))).toEqual([]);
  expect(calls.filter(u => u.startsWith('https://api.open-meteo.com/'))).toHaveLength(1);
  expect(errors).toEqual([]);
});
test('location search works from keyboard and changes forecast point', async ({page}) => {
  await page.goto('/'); await expect(page.locator('.hero-temperature')).toBeVisible();
  const input = page.getByRole('combobox', {name:'Search for a Philippine region or city'});
  await input.fill('Makati'); await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+-0/);
  await input.press('Enter');
  await expect(page.locator('.location-heading h3')).toHaveText('Makati');
  await expect(page.locator('.hero-temperature')).toHaveText('31°C');
});
test('theme and Filipino affect core content and navigation', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Switch to dark mode'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.getByRole('button',{name:'Switch to Filipino'}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','fil');
  await expect(page.getByRole('heading',{name:'Lokal na forecast'})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Pangunahing nabigasyon'}).getByRole('link',{name:'Taya ng panahon'})).toBeVisible();
});
test('provider outage exposes no invented current forecast and keeps official resources', async ({page}) => {
  await page.route('https://api.open-meteo.com/**', r => r.fulfill({status:503,json:{error:true}}));
  await page.goto('/'); await expect(page.getByRole('heading',{name:'Forecast unavailable'})).toBeVisible();
  await expect(page.locator('.hero-temperature')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'PAGASA tropical cyclone bulletins'})).toBeVisible();
});
for (const width of [320,390,768,1440]) test(`no page overflow at ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:900}); await page.goto('/'); await expect(page.locator('.hero-temperature')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.getByRole('button',{name:'Find mapped facilities — status unverified'}).click();
  await expect(page.getByText(/not verified operational evacuation centers/)).toBeVisible();
});
test('forecast tabs support arrow keys and radar failure stays explicit',async({page})=>{
 await page.goto('/'); await expect(page.locator('.hero-temperature')).toBeVisible();
 const selected=page.locator('.day-card.selected');await selected.focus();await selected.press('ArrowRight');
 await expect(page.locator('#forecast-day-panel h3')).toContainText('2026-10-19');
 await page.getByRole('button',{name:'Rain radar',exact:true}).click();
 await expect(page.getByText('Could not load radar data. Please try again later.')).toBeVisible();
});
