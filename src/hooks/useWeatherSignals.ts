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

// --- Exported Types ---

export interface WeatherSignal {
  tcws: number; // 0-5 (0 = no signal)
  tcwsLabel: string;
  tcwsDescription: string;
  rainfallWarning: 'none' | 'yellow' | 'orange' | 'red';
  rainfallLabel: string;
  maxWindGust: number; // km/h
  maxHourlyRain: number; // mm
  affectedAreas: string[];
  issuedAt: string;
  validUntil: string;
}

export interface SignalState {
  loading: boolean;
  error: string | null;
  signal: WeatherSignal | null;
}

// --- TCWS Classification ---

interface TcwsInfo {
  level: number;
  label: string;
  description: string;
}

function classifyTCWS(windSpeedKmh: number): TcwsInfo {
  if (windSpeedKmh > 220) {
    return { level: 5, label: 'TCWS #5', description: 'Catastrophic winds imminent' };
  }
  if (windSpeedKmh >= 185) {
    return { level: 4, label: 'TCWS #4', description: 'Very destructive typhoon-force winds in 12 hours' };
  }
  if (windSpeedKmh >= 118) {
    return { level: 3, label: 'TCWS #3', description: 'Destructive typhoon-force winds in 18 hours' };
  }
  if (windSpeedKmh >= 89) {
    return { level: 2, label: 'TCWS #2', description: 'Damaging gale-force winds in 24 hours' };
  }
  if (windSpeedKmh >= 62) {
    return { level: 1, label: 'TCWS #1', description: 'Strong winds expected in 36 hours' };
  }
  return { level: 0, label: 'No Signal', description: 'No tropical cyclone wind signal' };
}

// --- Rainfall Warning Classification ---

interface RainfallInfo {
  warning: 'none' | 'yellow' | 'orange' | 'red';
  label: string;
}

function classifyRainfall(mmPerHour: number): RainfallInfo {
  if (mmPerHour > 30) {
    return { warning: 'red', label: 'Red Rainfall Warning' };
  }
  if (mmPerHour >= 15) {
    return { warning: 'orange', label: 'Orange Rainfall Warning' };
  }
  if (mmPerHour >= 7.5) {
    return { warning: 'yellow', label: 'Yellow Rainfall Warning' };
  }
  return { warning: 'none', label: 'No Rainfall Warning' };
}

// --- Fetch with Retry (429 rate-limit handling) ---

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response;
    if (response.status === 429 && attempt < retries - 1) {
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

// --- Affected Areas Helper ---

function getAffectedAreas(region: string): string[] {
  // Return the region itself as the affected area; can be extended with sub-areas
  return [region];
}

// --- Main Hook ---

export function useWeatherSignals(
  region: string,
  cityCoords?: { lat: number; lon: number } | null
): SignalState & { refetch: () => void } {
  const [state, setState] = useState<SignalState>({
    loading: true,
    error: null,
    signal: null,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stabilize coords to primitives to avoid referential loops (same pattern as useWeatherData)
  const coordsLat = cityCoords?.lat ?? REGION_COORDS[region]?.lat ?? null;
  const coordsLon = cityCoords?.lon ?? REGION_COORDS[region]?.lon ?? null;

  const fetchSignals = useCallback(async () => {
    if (coordsLat === null || coordsLon === null) {
      setState({ loading: false, error: 'Unknown region', signal: null });
      return;
    }
    const coords = { lat: coordsLat, lon: coordsLon };

    // Check cache first (30 min TTL via useWeatherCache)
    const cacheKey = `signals-${coords.lat}-${coords.lon}`;
    const cached = getCached<WeatherSignal>(cacheKey);
    if (cached) {
      setState({ loading: false, error: null, signal: cached });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch wind gusts and precipitation for the next 72 hours (3 days)
      const hourlyVars = 'wind_gusts_10m,precipitation';
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=${hourlyVars}&timezone=Asia/Manila&forecast_days=3`;

      const response = await fetchWithRetry(url);
      const data = await response.json();

      const windGusts: number[] = data.hourly.wind_gusts_10m ?? [];
      const precipitation: number[] = data.hourly.precipitation ?? [];

      // Determine max wind gust across the 72-hour window
      const maxWindGust = windGusts.length > 0 ? Math.max(...windGusts) : 0;

      // Determine max hourly rainfall across the 72-hour window
      const maxHourlyRain = precipitation.length > 0 ? Math.max(...precipitation) : 0;

      // Classify signals
      const tcwsInfo = classifyTCWS(maxWindGust);
      const rainfallInfo = classifyRainfall(maxHourlyRain);

      const now = new Date();
      const validUntil = new Date(now.getTime() + 72 * 60 * 60 * 1000);

      const signal: WeatherSignal = {
        tcws: tcwsInfo.level,
        tcwsLabel: tcwsInfo.label,
        tcwsDescription: tcwsInfo.description,
        rainfallWarning: rainfallInfo.warning,
        rainfallLabel: rainfallInfo.label,
        maxWindGust: Math.round(maxWindGust * 10) / 10,
        maxHourlyRain: Math.round(maxHourlyRain * 10) / 10,
        affectedAreas: getAffectedAreas(region),
        issuedAt: now.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        validUntil: validUntil.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      };

      setState({ loading: false, error: null, signal });

      // Cache for 30 minutes
      setCache(cacheKey, signal);
    } catch (err) {
      // Try stale localStorage cache as fallback
      const cacheKey = `signals-${coords.lat}-${coords.lon}`;
      const stale = getStaleCached<WeatherSignal>(cacheKey);
      if (stale) {
        setState({ loading: false, error: null, signal: stale });
        return;
      }

      setState({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch weather signals',
        signal: null,
      });
    }
  }, [region, coordsLat, coordsLon]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchSignals();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchSignals]);

  return { ...state, refetch: fetchSignals };
}
