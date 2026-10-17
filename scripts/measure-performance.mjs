import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {forecastFixture} from '../e2e/fixtures.ts';
import {manilaDate} from '../src/utils/time.ts';
const url=process.env.WEATHER_PERF_URL || 'http://127.0.0.1:4174/';
const browser=await chromium.launch();
const samples=[];
try {
 for(let run=0;run<3;run++) {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.route('https://**/*', route=>{
    if(!route.request().url().startsWith('https://api.open-meteo.com/')) return route.abort();
    const data=forecastFixture(route.request().url());
    const base=Date.parse(manilaDate()+'T00:00:00Z');
    data.hourly.time=data.hourly.time.map((_time,i)=>new Date(base+i*3600000).toISOString().slice(0,16));
    return route.fulfill({json:data});
  });
  await page.addInitScript(()=>{window.__weatherPerf={lcp:null,cls:0};new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__weatherPerf.lcp=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__weatherPerf.cls+=entry.value;}).observe({type:'layout-shift',buffered:true});});
  const session=await context.newCDPSession(page);
  await session.send('Network.enable');await session.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:75000,connectionType:'cellular4g'});
  await session.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto(url,{waitUntil:'networkidle'});await page.locator('.hero-temperature').waitFor();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  samples.push(await page.evaluate(()=>({fcpMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,lcpMs:window.__weatherPerf.lcp,cls:window.__weatherPerf.cls,domContentLoadedMs:performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd ?? null,jsTransferBytes:performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.js')).reduce((s,e)=>s+e.transferSize,0),initialHeavyChunks:performance.getEntriesByType('resource').filter(e=>/leaflet|recharts|WeatherReality/.test(e.name)).map(e=>e.name)})));
  await context.close();
 }
} finally {await browser.close();}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const report={scope:'Local production build, deterministic weather fixtures, not Lighthouse or production telemetry',viewport:'390x844',cpuSlowdown:4,network:{latencyMs:150,downloadBytesPerSecond:200000,uploadBytesPerSecond:75000},samples,median:{fcpMs:median(samples.map(s=>s.fcpMs)),lcpMs:median(samples.map(s=>s.lcpMs)),cls:median(samples.map(s=>s.cls))}};
await mkdir('test-results',{recursive:true});await writeFile('test-results/mobile-performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
