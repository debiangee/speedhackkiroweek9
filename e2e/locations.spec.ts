import {test,expect} from '@playwright/test';
import {prepare} from './fixtures';
test.beforeEach(async({page})=>{await prepare(page);});
test('shared location/date loads exact point and saves it across reloads',async({page})=>{
 await page.goto('/?location=NCR%3AMakati&date=2026-10-20');
 await expect(page.locator('.hero-temperature')).toHaveText('31°C');
 await expect(page.getByText('Shared forecast context:',{exact:false})).toBeVisible();
 await expect(page.locator('.day-card.selected')).toContainText('Oct 20');
 await page.getByRole('button',{name:'Save location',exact:true}).click();
 await page.reload();await expect(page.locator('.hero-temperature')).toHaveText('31°C');
 await expect(page.getByRole('group',{name:'Saved locations'}).getByRole('button',{name:'Makati',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Remove Makati from saved locations'}).click();
 await expect(page.getByRole('group',{name:'Saved locations'})).toHaveCount(0);
});
test('old shared context falls back visibly and lightweight mode suppresses maps',async({page})=>{
 await page.goto('/?location=unknown&date=2020-01-01');await expect(page.locator('.hero-temperature')).toBeVisible();
 await expect(page.getByText(/Shared location or date is unavailable/)).toBeVisible();
 await page.getByRole('checkbox',{name:'Lightweight mode — disable maps and imagery'}).check();
 await expect(page.getByRole('button',{name:'Rain radar',exact:true})).toBeDisabled();
 await page.reload(); await expect(page.getByRole('checkbox',{name:'Lightweight mode — disable maps and imagery'})).toBeChecked();
});
test('denied storage still allows forecast and language switching',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('denied');};Storage.prototype.setItem=()=>{throw new Error('denied');};});
 await page.goto('/');await expect(page.locator('.hero-temperature')).toHaveText('27°C');
 await page.getByRole('button',{name:'Switch to Filipino'}).click();await expect(page.locator('html')).toHaveAttribute('lang','fil');
});
