import { REGION_COORDS } from '../utils/locations';
import { useState, useEffect, useCallback, useRef } from 'react';
import { requestForecast } from '../services/forecast-provider';
import type { ForecastMetadata } from '../models/weather';


export type { HourlyData, DailySummary, WeatherState } from '../models/weather';
import type { WeatherState } from '../models/weather';

const empty: WeatherState = { loading: true, error: null, hourly: [], daily: [], lastUpdated: null };
export function useWeatherData(region: string, cityCoords?: { lat: number; lon: number } | null) {
  const lat = cityCoords?.lat ?? REGION_COORDS[region]?.lat;
  const lon = cityCoords?.lon ?? REGION_COORDS[region]?.lon;
  const identity = `${lat},${lon}`;
  const [state, setState] = useState<WeatherState & { identity?: string; metadata?: ForecastMetadata }>(empty);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const refetch = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    const timer = setInterval(refetch, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') refetch(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [refetch]);
  useEffect(() => {
    const request = ++generation.current;
    const controller = new AbortController();
    const commit = (next: WeatherState & { metadata?: ForecastMetadata }) => { if (request === generation.current) setState({ ...next, identity }); };
    async function load() {
      if (lat === undefined || lon === undefined) { commit({ ...empty, loading: false, error: 'Unknown location' }); return; }
      // Retain same-point data while a fresh-cache check runs, never another point.
      try {
        const data = await requestForecast({ lat, lon }, controller.signal);
        const { metadata } = data;
        commit({ hourly: data.hourly, daily: data.daily, metadata, loading: false, error: null,
          lastUpdated: `Open-Meteo forecast · ${metadata.delivery === 'cache' ? 'cached' : 'retrieved'} ${new Date(metadata.retrievedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} PHT · age ${Math.floor(metadata.cacheAgeMs / 60000)} min (expires at 30 min)` });
      } catch (err) {
        if (!controller.signal.aborted) commit({ ...empty, loading: false, error: err instanceof Error ? err.message : 'Forecast unavailable' });
      }
    }
    load();
    return () => { ++generation.current; controller.abort(); };
  }, [lat, lon, identity, revision]);
  return { ...(state.identity === identity ? state : empty), refetch };
}
