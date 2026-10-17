import {it,expect,vi,afterEach} from 'vitest';
import {requestForecast} from '../services/forecast-provider';
import {FORECAST_FIELDS} from '../services/forecast-parser';
import {clearCache} from '../hooks/useWeatherCache';
function fixture(){return {timezone:'Asia/Manila',hourly:{time:['2026-10-18T00:00'],...Object.fromEntries(FORECAST_FIELDS.map(field=>[field,[field==='temperature_2m'?27:0]]))}};}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();clearCache();});
it.each([429,503])('production provider retries %s once after real bounded backoff',async(status)=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-17T16:10:00Z'));
 const fetcher=vi.fn().mockResolvedValueOnce({ok:false,status}).mockResolvedValueOnce({ok:true,json:async()=>fixture()});vi.stubGlobal('fetch',fetcher);
 const result=requestForecast({lat:13+status/10000,lon:121});
 await vi.advanceTimersByTimeAsync(499);expect(fetcher).toHaveBeenCalledTimes(1);
 await vi.advanceTimersByTimeAsync(1);expect((await result).hourly).toHaveLength(1);expect(fetcher).toHaveBeenCalledTimes(2);
});
it('persistent rate limiting stops after two attempts',async()=>{
 vi.useFakeTimers();const fetcher=vi.fn().mockResolvedValue({ok:false,status:429});vi.stubGlobal('fetch',fetcher);
 const result=expect(requestForecast({lat:13.51,lon:121})).rejects.toMatchObject({kind:'rate-limit'});
 await vi.advanceTimersByTimeAsync(500);await result;expect(fetcher).toHaveBeenCalledTimes(2);
});
it('nonretryable errors do not loop',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:false,status:404});vi.stubGlobal('fetch',fetcher);
 await expect(requestForecast({lat:13.52,lon:121})).rejects.toMatchObject({kind:'unavailable'});expect(fetcher).toHaveBeenCalledTimes(1);
});
it('a hanging request is aborted within the total request timeout',async()=>{
 vi.useFakeTimers();vi.stubGlobal('fetch',vi.fn((_url:string,options:{signal:AbortSignal})=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))));
 const result=expect(requestForecast({lat:13.53,lon:121})).rejects.toMatchObject({kind:'timeout'});
 await vi.advanceTimersByTimeAsync(15000);await result;
});
