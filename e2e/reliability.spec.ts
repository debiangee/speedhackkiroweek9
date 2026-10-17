import {test,expect} from '@playwright/test';
import {prepare,TEST_TIME} from './fixtures';
test.beforeEach(async({page})=>{await prepare(page);});
test('loaded fresh forecast can work offline but expires visibly',async({page,context})=>{
 await page.goto('/');await expect(page.locator('.hero-temperature')).toHaveText('27°C');
 await page.unroute('https://**/*');await context.setOffline(true);
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect(page.locator('.hero-temperature')).toHaveText('27°C');
 await page.clock.setFixedTime(new Date(TEST_TIME.getTime()+31*60000));
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect(page.getByRole('heading',{name:'Forecast unavailable'})).toBeVisible();
 await expect(page.locator('.hero-temperature')).toHaveCount(0);
});
test('migration worker removes owned legacy caches and preserves other application caches',async({page})=>{
 await page.goto('/');await expect(page.locator('.hero-temperature')).toBeVisible();
 await page.evaluate(async()=>{
   await navigator.serviceWorker.ready;
   await caches.open('ulanba-v1'); await caches.open('unrelated-app-fixture');
   await navigator.serviceWorker.register('/sw.js?migration-test=1',{scope:'/'});
 });
 await expect.poll(()=>page.evaluate(()=>caches.keys())).not.toContain('ulanba-v1');
 expect(await page.evaluate(()=>caches.keys())).toContain('unrelated-app-fixture');
});
test('preview applies nonbreaking security headers and explicit CSP review mode',async({request})=>{
 const response=await request.get('/');const headers=response.headers();
 expect(headers['x-content-type-options']).toBe('nosniff');
 expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
 expect(headers['content-security-policy-report-only']).toContain("object-src 'none'");
 expect(headers['permissions-policy']).toContain('geolocation=(self)');
});
