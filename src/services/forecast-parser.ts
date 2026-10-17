// Fail closed: incomplete forecasts never enter recommendation engines.
import type { HourlyData, DailySummary } from '../hooks/useWeatherData';

export const FORECAST_FIELDS = ["temperature_2m", "relative_humidity_2m", "dew_point_2m", "precipitation", "precipitation_probability", "wind_speed_10m", "wind_gusts_10m", "weather_code", "cloud_cover", "visibility", "uv_index"] as const;
const RANGES: Record<string, readonly [number, number]> = {"temperature_2m": [-100, 70], "relative_humidity_2m": [0, 100], "dew_point_2m": [-120, 70], "precipitation": [0, 1000], "precipitation_probability": [0, 100], "wind_speed_10m": [0, 500], "wind_gusts_10m": [0, 600], "weather_code": [0, 99], "cloud_cover": [0, 100], "visibility": [0, 100000], "uv_index": [0, 100]};
export function parseForecast(input: unknown): { hourly: HourlyData[]; daily: DailySummary[] } {
  const data = input as { timezone?: string; hourly?: Record<string, unknown[]> };
  if (!data || data.timezone !== 'Asia/Manila' || !data.hourly || !Array.isArray(data.hourly.time) || !data.hourly.time.length) {
    throw new Error('Forecast unavailable: invalid provider response');
  }
  const time = data.hourly.time;
  let previous = -Infinity;
  for (const value of time) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:00$/.test(value)) throw new Error('Forecast unavailable: invalid time');
    const epoch = Date.parse(value + '+08:00');
    if (!Number.isFinite(epoch) || (previous !== -Infinity && epoch - previous !== 3600000)) throw new Error('Forecast unavailable: noncontiguous time');
    previous = epoch;
  }
  for (const field of FORECAST_FIELDS) {
    const values = data.hourly[field];
    const [min, max] = RANGES[field];
    if (!Array.isArray(values) || values.length !== time.length || values.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)) {
      throw new Error(`Forecast unavailable: missing or invalid ${field}`);
    }
  }
  // Values have been validated above; preserve legitimate zeros.
  const validated = data as unknown as { hourly: Record<string, number[]> & { time: string[] } };
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

      for (let i = 0; i < validated.hourly.time.length; i++) {
        const time = validated.hourly.time[i];
        const date = time.split('T')[0];
        const hour = parseInt(time.split('T')[1].split(':')[0], 10);

        const entry: HourlyData = {
          time,
          date,
          hour,
          temperature: validated.hourly.temperature_2m[i] ?? 0,
          humidity: validated.hourly.relative_humidity_2m[i] ?? 0,
          precipitation: validated.hourly.precipitation[i] ?? 0,
          precipitation_probability: validated.hourly.precipitation_probability[i] ?? 0,
          wind_speed: validated.hourly.wind_speed_10m[i] ?? 0,
          wind_gusts: validated.hourly.wind_gusts_10m?.[i] ?? 0,
          weather_code: validated.hourly.weather_code[i] ?? 0,
          cloud_cover: validated.hourly.cloud_cover?.[i] ?? 0,
          dew_point: validated.hourly.dew_point_2m?.[i] ?? 0,
          visibility: validated.hourly.visibility?.[i] ?? 10000,
          uv_index: validated.hourly.uv_index?.[i] ?? 0,
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

  return { hourly, daily };
}
