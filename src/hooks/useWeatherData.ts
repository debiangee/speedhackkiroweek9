import { useState, useEffect, useCallback, useRef } from 'react';
import { getCached, setCache } from './useWeatherCache';
import { parseForecast, FORECAST_FIELDS } from '../services/forecast-parser';
import { hasCriticalData } from '../utils/trip-verdict';
import { manilaDate } from '../utils/time';
const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'NCR': { lat: 14.5995, lon: 120.9842 },
  'CAR': { lat: 16.4023, lon: 120.596 },
  'Ilocos': { lat: 17.5747, lon: 120.3869 },
  'Cagayan Valley': { lat: 17.6132, lon: 121.727 },
  'Central Luzon': { lat: 15.145, lon: 120.5887 },
  'CALABARZON': { lat: 14.1, lon: 121.3 },
  'MIMAROPA': { lat: 9.7392, lon: 118.7353 },
  'Bicol': { lat: 13.1391, lon: 123.7438 },
  'Western Visayas': { lat: 10.7202, lon: 122.5621 },
  'Central Visayas': { lat: 10.3157, lon: 123.8854 },
  'Eastern Visayas': { lat: 11.25, lon: 125.0 },
  'Zamboanga Peninsula': { lat: 6.9214, lon: 122.079 },
  'Northern Mindanao': { lat: 8.4542, lon: 124.6319 },
  'Davao': { lat: 7.1907, lon: 125.4553 },
  'SOCCSKSARGEN': { lat: 6.5, lon: 124.85 },
  'Caraga': { lat: 8.9475, lon: 125.5406 },
  'BARMM': { lat: 7.2, lon: 124.23 },
};

export interface HourlyData {
  time: string;
  date: string;
  hour: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  wind_gusts: number;
  weather_code: number;
  cloud_cover: number;
  dew_point: number;
  visibility: number;
  uv_index: number;
}

export interface DailySummary {
  date: string;
  avg_prob: number;
  max_prob: number;
  total_rain: number;
  avg_temp: number;
  min_temp: number;
  max_temp: number;
  avg_humidity: number;
  avg_wind: number;
  max_wind_gusts: number;
  dominant_weather_code: number;
  rain_hours: number;
  dry_hours: number;
}

export interface WeatherState {
  loading: boolean;
  error: string | null;
  hourly: HourlyData[];
  daily: DailySummary[];
  lastUpdated: string | null;
}


interface CachedForecast { hourly: HourlyData[]; daily: DailySummary[]; retrievedAt: number }
const empty: WeatherState = { loading: true, error: null, hourly: [], daily: [], lastUpdated: null };
export function useWeatherData(region: string, cityCoords?: { lat: number; lon: number } | null) {
  const lat = cityCoords?.lat ?? REGION_COORDS[region]?.lat;
  const lon = cityCoords?.lon ?? REGION_COORDS[region]?.lon;
  const identity = `${lat},${lon}`;
  const [state, setState] = useState<WeatherState & { identity?: string }>(empty);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const refetch = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    const timer = setInterval(refetch, 5 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') refetch(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [refetch]);
  useEffect(() => {
    const request = ++generation.current;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const commit = (next: WeatherState) => { if (request === generation.current) setState({ ...next, identity }); };
    async function load() {
      if (lat === undefined || lon === undefined) { commit({ ...empty, loading: false, error: 'Unknown location' }); return; }
      const key = `forecast-v2-${lat}-${lon}`;
      const cached = getCached<CachedForecast>(key);
      if (cached && Array.isArray(cached.hourly) && cached.hourly.length > 0 && cached.hourly.every(hasCriticalData) && Number.isFinite(cached.retrievedAt) && Array.isArray(cached.daily) && cached.daily.some(d => d.date === manilaDate())) {
        commit({ ...cached, loading: false, error: null, lastUpdated: `Cached forecast · retrieved ${new Date(cached.retrievedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (PHT); valid cache ≤30 minutes` });
        return;
      }
      commit({ ...empty, loading: true });
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${FORECAST_FIELDS.join(',')}&timezone=Asia/Manila&forecast_days=7`;
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(`Forecast provider unavailable (${response.status}). Please retry.`);
        const forecast = parseForecast(await response.json());
        if (controller.signal.aborted) return;
        const retrievedAt = Date.now();
        setCache(key, { ...forecast, retrievedAt });
        commit({ ...forecast, loading: false, error: null, lastUpdated: `Open-Meteo forecast · retrieved ${new Date(retrievedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (PHT)` });
      } catch (err) {
        commit({ ...empty, loading: false, error: controller.signal.aborted ? 'Forecast unavailable: request cancelled or timed out. Cached forecasts are not used beyond 30 minutes.' : err instanceof Error ? err.message : 'Forecast unavailable' });
      }
    }
    const debounce = setTimeout(load, 150);
    return () => { ++generation.current; clearTimeout(debounce); clearTimeout(timeout); controller.abort(); };
  }, [lat, lon, identity, revision]);
  return { ...(state.identity === identity ? state : empty), refetch };
}
