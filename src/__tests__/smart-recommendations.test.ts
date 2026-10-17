import { describe, it, expect } from 'vitest';
import type { HourlyData } from '../hooks/useWeatherData';

import { getUmbrellaRec, getFloodRisk, getMotorcycleConditions, getWindAlert } from '../components/SmartRecommendations';
const getUmbrellaSeverity = (hours: HourlyData[]) => getUmbrellaRec(hours).severity;
const getMotorcycleSeverity = (hours: HourlyData[]) => getMotorcycleConditions(hours).severity;
const getWindSeverity = (hours: HourlyData[]) => getWindAlert(hours)?.severity ?? null;

function makeHourlyData(overrides: Partial<HourlyData>[]): HourlyData[] {
  return overrides.map((o, i) => ({
    time: `2026-08-14T${String(i).padStart(2, '0')}:00`,
    date: '2026-08-14',
    hour: i,
    temperature: 28,
    humidity: 80,
    precipitation: 0,
    precipitation_probability: 30,
    wind_speed: 10,
    wind_gusts: 15,
    weather_code: 0,
    cloud_cover: 50,
    dew_point: 24,
    visibility: 10000,
    uv_index: 3,
    ...o,
  }));
}

describe('getUmbrellaSeverity (map + reduce loop)', () => {
  it('returns safe when all probabilities are below 20', () => {
    const hourly = makeHourlyData(Array(6).fill({ precipitation_probability: 10 }));
    expect(getUmbrellaSeverity(hourly)).toBe('safe');
  });

  it('returns caution when max >= 20 but avg < 40', () => {
    const hourly = makeHourlyData([
      { precipitation_probability: 50 },
      { precipitation_probability: 20 },
      { precipitation_probability: 10 },
      { precipitation_probability: 10 },
      { precipitation_probability: 10 },
      { precipitation_probability: 10 },
    ]);
    expect(getUmbrellaSeverity(hourly)).toBe('caution');
  });

  it('returns warning when avg is between 40 and 70', () => {
    const hourly = makeHourlyData(Array(6).fill({ precipitation_probability: 55 }));
    expect(getUmbrellaSeverity(hourly)).toBe('warning');
  });

  it('returns danger when avg >= 70', () => {
    const hourly = makeHourlyData(Array(6).fill({ precipitation_probability: 85 }));
    expect(getUmbrellaSeverity(hourly)).toBe('danger');
  });

  it('handles single data point correctly', () => {
    const hourly = makeHourlyData([{ precipitation_probability: 5 }]);
    expect(getUmbrellaSeverity(hourly)).toBe('safe');
  });

  it('handles mixed probabilities across a full day', () => {
    // Morning dry, afternoon heavy - average should be around 45 = warning
    const hourly = makeHourlyData(
      Array.from({ length: 24 }, (_, i) => ({
        precipitation_probability: i < 12 ? 10 : 80,
      }))
    );
    expect(getUmbrellaSeverity(hourly)).toBe('warning');
  });
});

describe('flood information is explicitly unknown regardless of rain', () => {
  it.each([0, 2, 15, 100])('does not infer operational flood safety from %s mm', rain => {
    const result = getFloodRisk(makeHourlyData([{ precipitation: rain }]));
    expect(result.title).toBe('Flood conditions unknown');
    expect(result.description).toContain('Rain forecasts alone cannot establish flood risk');
  });
});

describe('getMotorcycleSeverity (reduce + map loop)', () => {
  it('returns safe for low probability and low wind', () => {
    const hourly = makeHourlyData(Array(6).fill({
      precipitation_probability: 10,
      wind_speed: 15,
      precipitation: 0,
    }));
    expect(getMotorcycleSeverity(hourly)).toBe('safe');
  });

  it('returns caution for moderate conditions', () => {
    const hourly = makeHourlyData(Array(6).fill({
      precipitation_probability: 35,
      wind_speed: 35,
      precipitation: 3,
    }));
    expect(getMotorcycleSeverity(hourly)).toBe('caution');
  });

  it('returns warning for high wind but limited rain', () => {
    const hourly = makeHourlyData(Array(6).fill({
      precipitation_probability: 60,
      wind_speed: 45,
      precipitation: 10,
    }));
    expect(getMotorcycleSeverity(hourly)).toBe('warning');
  });

  it('returns danger for extreme conditions', () => {
    const hourly = makeHourlyData(Array(6).fill({
      precipitation_probability: 80,
      wind_speed: 60,
      precipitation: 20,
    }));
    expect(getMotorcycleSeverity(hourly)).toBe('danger');
  });
});

describe('getWindSeverity (map loop)', () => {
  it('returns null when all winds are below 30', () => {
    const hourly = makeHourlyData(Array(6).fill({ wind_speed: 20 }));
    expect(getWindSeverity(hourly)).toBeNull();
  });

  it('returns caution for moderate wind (30-49)', () => {
    const hourly = makeHourlyData([
      { wind_speed: 10 },
      { wind_speed: 45 },
      { wind_speed: 20 },
    ]);
    expect(getWindSeverity(hourly)).toBe('caution');
  });

  it('returns danger for strong wind (>= 50)', () => {
    const hourly = makeHourlyData([
      { wind_speed: 10 },
      { wind_speed: 55 },
      { wind_speed: 20 },
    ]);
    expect(getWindSeverity(hourly)).toBe('danger');
  });

  it('correctly finds max wind across many entries', () => {
    const hourly = makeHourlyData(
      Array.from({ length: 24 }, (_, i) => ({ wind_speed: i === 15 ? 52 : 10 }))
    );
    expect(getWindSeverity(hourly)).toBe('danger');
  });
});
