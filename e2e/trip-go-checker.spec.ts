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
test('departure window controls which forecast hours are evaluated', async ({page}) => {
  await page.route('https://api.open-meteo.com/**', async route => {
    const {forecastFixture} = await import('./fixtures'); const data=forecastFixture(route.request().url());
    data.hourly.wind_gusts_10m[14]=100; await route.fulfill({json:data});
  });
  await page.locator('#tgc-region').selectOption('Bicol');
  await expect(page.locator('.tgc-verdict-label')).toHaveText('Consider postponing');
  await page.locator('#trip-departure').selectOption('2026-10-18T15:00');
  await expect(page.locator('.tgc-verdict-label')).toHaveText('Lower forecast disruption');
});
test('Kuya Weather uses a selected city and handles unknown questions', async ({page}) => {
  const input=page.getByRole('combobox',{name:'Search for a Philippine region or city'}); await input.fill('Makati'); await input.press('ArrowDown'); await input.press('Enter');
  await expect(page.locator('.hero-temperature')).toHaveText('31°C');
  await page.getByRole('button',{name:'Open forecast guide',exact:true}).click();
  const question=page.getByRole('textbox',{name:'Type your weather question'});
  await expect(question).toBeFocused(); await question.fill('weather now'); await question.press('Enter');
  await expect(page.getByRole('log')).toContainText('Makati');
  await expect(page.getByRole('log')).toContainText('31°C');
  await question.fill('write a song'); await question.press('Enter');
  await expect(page.getByRole('log')).toContainText('not generative AI');
  await question.press('Escape'); await expect(page.getByRole('dialog',{name:'Kuya Weather Assistant'})).toHaveCount(0);
});
test('Weather Reality obtains imagery-point forecast and supports keyboard collapse', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  const requests: string[]=[]; page.on('request',r=>requests.push(r.url()));
  await page.getByRole('button',{name:'Weather Reality',exact:true}).click();
  await expect(page.locator('.weather-reality-card')).toBeVisible();
  await expect(page.locator('.weather-reality-card')).toContainText('requested for the displayed imagery coordinates');
  expect(requests.some(u=>u.startsWith('https://api.open-meteo.com/'))).toBe(true);
  await expect(page.locator('.status-pill')).toContainText('Forecast');
  await page.getByRole('button',{name:'Expand Simulation',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Weather Reality simulation'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog',{name:'Weather Reality simulation'})).toHaveCount(0);
});
