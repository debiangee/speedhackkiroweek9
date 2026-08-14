import { useState, useEffect, useCallback, useRef } from 'react';
import { getCached, setCache, getStaleCached } from './useWeatherCache';

// Region center coordinates for Open-Meteo API queries
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

// Fetch with retry on 429 (rate limit)
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response;
    if (response.status === 429 && attempt < retries - 1) {
      // Wait before retry: 2s, 4s, 8s
      await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
      continue;
    }
    throw new Error(
      response.status === 429
        ? 'Weather service is busy. Please wait a moment and try again.'
        : `Weather API error: ${response.status}`
    );
  }
  throw new Error('Failed after retries');
}

export function useWeatherData(region: string, cityCoords?: { lat: number; lon: number } | null) {
  const [state, setState] = useState<WeatherState>({
    loading: true,
    error: null,
    hourly: [],
    daily: [],
    lastUpdated: null,
  });

  // Debounce: wait 300ms before fetching to avoid rapid-fire calls
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stabilize coords to primitives to avoid referential loops
  const coordsLat = cityCoords?.lat ?? REGION_COORDS[region]?.lat ?? null;
  const coordsLon = cityCoords?.lon ?? REGION_COORDS[region]?.lon ?? null;

  const fetchData = useCallback(async () => {
    if (coordsLat === null || coordsLon === null) {
      setState((prev) => ({ ...prev, loading: false, error: 'Unknown region' }));
      return;
    }
    const coords = { lat: coordsLat, lon: coordsLon };

    // Check cache first (60 min TTL)
    const cacheKey = `weather-${coords.lat}-${coords.lon}`;
    const cached = getCached<{ hourly: HourlyData[]; daily: DailySummary[] }>(cacheKey);
    if (cached) {
      setState({
        loading: false,
        error: null,
        hourly: cached.hourly,
        daily: cached.daily,
        lastUpdated: 'cached',
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch hourly data with extended variables for better accuracy
      const hourlyVars = [
        'temperature_2m',
        'relative_humidity_2m',
        'dew_point_2m',
        'precipitation',
        'precipitation_probability',
        'wind_speed_10m',
        'wind_gusts_10m',
        'weather_code',
        'cloud_cover',
        'visibility',
        'uv_index',
      ].join(',');

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=${hourlyVars}&timezone=Asia/Manila&forecast_days=7`;

      const response = await fetchWithRetry(url);
      const data = await response.json();
      const hourly: HourlyData[] = [];
      const dailyMap: Map<string, {
        probs: number[];
        rains: number[];
        temps: number[];
        humidities: number[];
        winds: number[];
        gusts: number[];
        weatherCodes: number[];
      }> = new Map();

      for (let i = 0; i < data.hourly.time.length; i++) {
        const time = data.hourly.time[i];
        const date = time.split('T')[0];
        const hour = parseInt(time.split('T')[1].split(':')[0], 10);

        const entry: HourlyData = {
          time,
          date,
          hour,
          temperature: data.hourly.temperature_2m[i] ?? 0,
          humidity: data.hourly.relative_humidity_2m[i] ?? 0,
          precipitation: data.hourly.precipitation[i] ?? 0,
          precipitation_probability: data.hourly.precipitation_probability[i] ?? 0,
          wind_speed: data.hourly.wind_speed_10m[i] ?? 0,
          wind_gusts: data.hourly.wind_gusts_10m?.[i] ?? 0,
          weather_code: data.hourly.weather_code[i] ?? 0,
          cloud_cover: data.hourly.cloud_cover?.[i] ?? 0,
          dew_point: data.hourly.dew_point_2m?.[i] ?? 0,
          visibility: data.hourly.visibility?.[i] ?? 10000,
          uv_index: data.hourly.uv_index?.[i] ?? 0,
        };

        hourly.push(entry);

        if (!dailyMap.has(date)) {
          dailyMap.set(date, { probs: [], rains: [], temps: [], humidities: [], winds: [], gusts: [], weatherCodes: [] });
        }
        const day = dailyMap.get(date)!;
        day.probs.push(entry.precipitation_probability);
        day.rains.push(entry.precipitation);
        day.temps.push(entry.temperature);
        day.humidities.push(entry.humidity);
        day.winds.push(entry.wind_speed);
        day.gusts.push(entry.wind_gusts);
        day.weatherCodes.push(entry.weather_code);
      }

      const daily: DailySummary[] = [];
      for (const [date, stats] of dailyMap.entries()) {
        // Count rain vs dry hours using probability threshold
        const rainHours = stats.probs.filter((p) => p >= 30).length;
        const dryHours = stats.probs.length - rainHours;

        // Find dominant weather code (most frequent)
        const codeFreq = new Map<number, number>();
        for (const code of stats.weatherCodes) {
          codeFreq.set(code, (codeFreq.get(code) || 0) + 1);
        }
        let dominantCode = 0;
        let maxFreq = 0;
        for (const [code, freq] of codeFreq) {
          if (freq > maxFreq) { dominantCode = code; maxFreq = freq; }
        }

        daily.push({
          date,
          avg_prob: Math.round(stats.probs.reduce((a, b) => a + b, 0) / stats.probs.length),
          max_prob: Math.max(...stats.probs),
          total_rain: Math.round(stats.rains.reduce((a, b) => a + b, 0) * 10) / 10,
          avg_temp: Math.round((stats.temps.reduce((a, b) => a + b, 0) / stats.temps.length) * 10) / 10,
          min_temp: Math.round(Math.min(...stats.temps) * 10) / 10,
          max_temp: Math.round(Math.max(...stats.temps) * 10) / 10,
          avg_humidity: Math.round(stats.humidities.reduce((a, b) => a + b, 0) / stats.humidities.length),
          avg_wind: Math.round((stats.winds.reduce((a, b) => a + b, 0) / stats.winds.length) * 10) / 10,
          max_wind_gusts: Math.round(Math.max(...stats.gusts) * 10) / 10,
          dominant_weather_code: dominantCode,
          rain_hours: rainHours,
          dry_hours: dryHours,
        });
      }

      setState({
        loading: false,
        error: null,
        hourly,
        daily,
        lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      });

      // Cache for 30 minutes
      setCache(cacheKey, { hourly, daily });
    } catch (err) {
      // Try stale localStorage cache as fallback
      const stale = getStaleCached<{ hourly: HourlyData[]; daily: DailySummary[] }>(cacheKey);
      if (stale) {
        setState({
          loading: false,
          error: null,
          hourly: stale.hourly,
          daily: stale.daily,
          lastUpdated: 'offline (cached)',
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch weather data',
      }));
    }
  }, [region, coordsLat, coordsLon]);

  useEffect(() => {
    // Debounce: cancel previous timer, wait 300ms before fetching
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchData();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
