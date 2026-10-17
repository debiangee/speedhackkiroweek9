import { it, expect, vi, afterEach } from 'vitest';
import { detectIntent, assistantLocations, generateBotResponse } from '../services/weather-assistant';
import { scoreDay } from '../components/ActivityPlanner';
import { summarizeHours } from '../utils/daily';
import { readPreference, writePreference } from '../utils/storage';
import type { HourlyData, ForecastRecord } from '../models/weather';
const mock = vi.hoisted(()=>({request:vi.fn()}));
vi.mock('../services/forecast-provider',()=>({requestForecast:mock.request}));
const hour: HourlyData = { time:'2026-10-18T12:00', date:'2026-10-18', hour:12, temperature:28, humidity:70, precipitation:0, precipitation_probability:5, wind_speed:5, wind_gusts:10, weather_code:1, cloud_cover:10, visibility:10000, dew_point:22, uv_index:3 };
const record: ForecastRecord = {hourly:[hour], daily:summarizeHours([hour]),metadata:{provider:'Open-Meteo',sourceUrl:'https://open-meteo.com/',point:{lat:14,lon:121},timezone:'Asia/Manila',modelReferenceTime:null,retrievedAt:Date.parse('2026-10-18T04:00:00Z'),validFrom:hour.time,validTo:hour.time,quality:'validated',delivery:'network',cacheAgeMs:0,units:{temperature:'°C',wind:'km/h',precipitation:'mm',visibility:'m',probability:'%'}}};
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();mock.request.mockReset();});
it('recognizes comparison before current weather words and resolves exact cities',()=>{
 expect(detectIntent('compare Manila vs Cebu weather now')).toBe('compare');
 expect(assistantLocations('weather in Makati')[0].id).toBe('NCR:Makati');
 expect(assistantLocations('compare Manila vs Cebu')).toHaveLength(2);
});
it('unknown questions and flood operations do not manufacture forecasts or authoritative records',async()=>{
 expect((await generateBotResponse('write me a song','NCR')).text).toContain('rule-based');
 expect((await generateBotResponse('May baha ba?','NCR')).text).toContain('unknown');
 expect(mock.request).not.toHaveBeenCalled();
});
it('uses selected city context and labels forecast validity and source',async()=>{
 vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-18T04:30:00Z'));
 mock.request.mockResolvedValue(record);
 const response=await generateBotResponse('weather now','NCR','Makati');
 expect(mock.request.mock.calls[0][0].id).toBe('NCR:Makati');
 expect(response.text).toContain('Valid 2026-10-18T12:00 PHT');
 expect(response.text).toContain('Open-Meteo forecast');
 expect(response.realityAction?.city).toBe('Makati');
});
it('assistant provider failure is explicit and does not return expired weather',async()=>{
 mock.request.mockRejectedValue(new Error('offline'));
 expect((await generateBotResponse('weather now','NCR')).text).toContain('Forecast unavailable');
});
it('activity scoring refuses missing hours and applies critical hazard veto',()=>{
 const day=record.daily[0];
 expect(scoreDay('hiking',day,[]).reason).toContain('unavailable');
 expect(scoreDay('beach',day,[{...hour,wind_gusts:100}]).score).toBe(0);
 expect(scoreDay('commute',day,[hour]).reason).toContain('traffic unknown');
});
it('blocked browser storage is nonfatal',()=>{
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('denied');});
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});
 expect(readPreference('x')).toBeNull(); expect(writePreference('x','y')).toBe(false);
});
