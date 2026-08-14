import { useState, useEffect, useCallback, useRef } from 'react';

interface AirQualityHourly {
  hour: number;
  aqi: number;
  pm25: number;
  pm10: number;
}

interface AirQualityState {
  loading: boolean;
  data: AirQualityHourly[];
}

// Cache key + TTL (60 minutes)
const CACHE_TTL = 60 * 60 * 1000;

function getCached(key: string): AirQualityHourly[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(key: string, data: AirQualityHourly[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

/**
 * Get AQI bonus points for surge calculation
 * - AQI > 200 (Very Unhealthy): +20
 * - AQI > 150 (Unhealthy): +10
 * - Otherwise: 0
 */
export function getAqiBonus(aqi: number): number {
  if (aqi > 200) return 20;
  if (aqi > 150) return 10;
  return 0;
}

/**
 * Hook to fetch air quality data from Open-Meteo Air Quality API
 * Free, no API key required.
 * Fails silently — surge predictor works without AQ data.
 */
export function useAirQuality(coords: { lat: number; lon: number } | null) {
  const [state, setState] = useState<AirQualityState>({
    loading: false,
    data: [],
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAQ = useCallback(async () => {
    if (!coords) return;

    const cacheKey = `aq-${coords.lat}-${coords.lon}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setState({ loading: false, data: cached });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&hourly=pm2_5,pm10,us_aqi&timezone=Asia/Manila&forecast_days=1`;

      const response = await fetch(url);
      if (!response.ok) {
        // Fail silently
        console.warn('[AirQuality] API returned', response.status);
        setState({ loading: false, data: [] });
        return;
      }

      const json = await response.json();
      const hourlyData: AirQualityHourly[] = [];

      if (json.hourly && json.hourly.time) {
        for (let i = 0; i < json.hourly.time.length; i++) {
          const time = json.hourly.time[i] as string;
          const hour = parseInt(time.split('T')[1]?.split(':')[0] ?? '0', 10);

          hourlyData.push({
            hour,
            aqi: json.hourly.us_aqi?.[i] ?? 0,
            pm25: json.hourly.pm2_5?.[i] ?? 0,
            pm10: json.hourly.pm10?.[i] ?? 0,
          });
        }
      }

      setCache(cacheKey, hourlyData);
      setState({ loading: false, data: hourlyData });
    } catch (err) {
      // Fail silently — AQ is optional enhancement
      console.warn('[AirQuality] Fetch failed:', err);
      setState({ loading: false, data: [] });
    }
  }, [coords]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchAQ, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchAQ]);

  return state;
}
