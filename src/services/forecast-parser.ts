// Incomplete forecasts are unavailable; no favorable numeric defaults enter engines.
import type { HourlyData, DailySummary } from '../models/weather';
import { summarizeHours } from '../utils/daily';
import { manilaDate } from '../utils/time';
export const FIELD_MAP = {
  temperature_2m: 'temperature', relative_humidity_2m: 'humidity', dew_point_2m: 'dew_point',
  precipitation: 'precipitation', precipitation_probability: 'precipitation_probability',
  wind_speed_10m: 'wind_speed', wind_gusts_10m: 'wind_gusts', weather_code: 'weather_code',
  cloud_cover: 'cloud_cover', visibility: 'visibility', uv_index: 'uv_index',
} as const;
export const FORECAST_FIELDS = Object.keys(FIELD_MAP) as (keyof typeof FIELD_MAP)[];
const RANGES: Record<keyof typeof FIELD_MAP, readonly [number,number]> = {
  temperature_2m:[-100,70], relative_humidity_2m:[0,100], dew_point_2m:[-120,70], precipitation:[0,1000],
  precipitation_probability:[0,100], wind_speed_10m:[0,500], wind_gusts_10m:[0,600], weather_code:[0,99],
  cloud_cover:[0,100], visibility:[0,100000], uv_index:[0,100],
};
const WMO_CODES = new Set([0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]);
export function parseForecast(input: unknown): {hourly:HourlyData[];daily:DailySummary[]} {
  const data=input as {timezone?:string;hourly?:Record<string,unknown[]>;hourly_units?:Record<string,string>};
  if(!data || data.timezone!=='Asia/Manila' || !data.hourly || !Array.isArray(data.hourly.time) || !data.hourly.time.length || data.hourly.time.length>168) throw new Error('Forecast unavailable: invalid provider response');
  if(data.hourly_units && Object.entries({temperature_2m:'°C',wind_speed_10m:'km/h',precipitation:'mm',visibility:'m'}).some(([key,unit])=>data.hourly_units?.[key]!==unit)) throw new Error('Forecast unavailable: unexpected units');
  let previous=-Infinity;
  for(const value of data.hourly.time) {
    if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:00$/.test(value)) throw new Error('Forecast unavailable: invalid time');
    const epoch=Date.parse(value+'+08:00');
    if(!Number.isFinite(epoch) || manilaDate(new Date(epoch))!==value.slice(0,10) || (previous!==-Infinity && epoch-previous!==3600000)) throw new Error('Forecast unavailable: noncontiguous or invalid time');
    previous=epoch;
  }
  for(const field of FORECAST_FIELDS) {
    const values=data.hourly[field], [min,max]=RANGES[field];
    if(!Array.isArray(values) || values.length!==data.hourly.time.length || values.some(v=>typeof v!=='number' || !Number.isFinite(v) || v<min || v>max || (field==='weather_code' && !WMO_CODES.has(v)))) throw new Error(`Forecast unavailable: missing or invalid ${field}`);
  }
  const values=data.hourly as Record<string,number[]> & {time:string[]};
  const hourly=values.time.map((time,i)=>({time,date:time.slice(0,10),hour:Number(time.slice(11,13)),...Object.fromEntries(FORECAST_FIELDS.map(field=>[FIELD_MAP[field],values[field][i]]))})) as HourlyData[];
  return {hourly,daily:summarizeHours(hourly)};
}
export function revalidateHourly(input: unknown): ReturnType<typeof parseForecast> {
  if(!Array.isArray(input)) throw new Error('Forecast unavailable: invalid cache');
  const hours=input as Partial<HourlyData>[];
  return parseForecast({timezone:'Asia/Manila',hourly:{time:hours.map(h=>h?.time),...Object.fromEntries(FORECAST_FIELDS.map(field=>[field,hours.map(h=>h?.[FIELD_MAP[field]])]))}});
}
