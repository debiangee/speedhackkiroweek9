import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {prepare} from './fixtures';
for(const dark of [false,true]) test(`core experience has no automated WCAG AA violations (${dark?'dark':'light'})`,async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await prepare(page); await page.goto('/'); await expect(page.locator('.hero-temperature')).toBeVisible();
  if(dark) await page.getByRole('button',{name:'Switch to dark mode'}).click();
  await page.emulateMedia({reducedMotion:'reduce'});
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  await testInfo.attach('axe-results',{body:JSON.stringify(result.violations,null,2),contentType:'application/json'});
  expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await page.screenshot({path:`test-results/overview-${testInfo.project.name}-${dark?'dark':'light'}.png`});
});
