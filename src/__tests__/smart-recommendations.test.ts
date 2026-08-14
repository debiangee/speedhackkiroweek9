import { describe, it, expect } from 'vitest';
import type { HourlyData } from '../hooks/useWeatherData';

// Re-implement the pure logic from SmartRecommendations for unit testing
type Severity = 'safe' | 'caution' | 'warning' | 'danger';

function getUmbrellaSeverity(hourly: HourlyData[]): Severity {
  const maxProb = Math.max(...hourly.map((h) => h.precipitation_probability));
  const avgProb = hourly.reduce((s, h) => s + h.precipitation_probability, 0) / hourly.length;

  if (maxProb < 20) return 'safe';
  if (avgProb < 40) return 'caution';
  if (avgProb < 70) return 'warning';
  return 'danger';
}

function getFloodSeverity(hourly: HourlyData[]): Severity {
  const totalRain = hourly.reduce((s, h) => s + h.precipitation, 0);
  const maxHourlyRain = Math.max(...hourly.map((h) => h.precipitation));

  if (totalRain < 10 && maxHourlyRain < 5) return 'safe';
  if (totalRain < 30 && maxHourlyRain < 15) return 'caution';
  if (totalRain < 60) return 'warning';
  return 'danger';
}

function getMotorcycleSeverity(hourly: HourlyData[]): Severity {
  const avgProb = hourly.reduce((s, h) => s + h.precipitation_probability, 0) / hourly.length;
  const maxWind = Math.max(...hourly.map((h) => h.wind_speed));
  const maxRain = Math.max(...hourly.map((h) => h.precipitation));

  if (avgProb < 25 && maxWind < 30) return 'safe';
  if (avgProb < 50 && maxWind < 40) return 'caution';
  if (maxRain < 15 && maxWind < 50) return 'warning';
  return 'danger';
}

function getWindSeverity(hourly: HourlyData[]): Severity | null {
  const maxWind = Math.max(...hourly.map((h) => h.wind_speed));
  if (maxWind < 30) return null;
  if (maxWind < 50) return 'caution';
  return 'danger';
}

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

describe('getFloodSeverity (reduce + map loop)', () => {
  it('returns safe for minimal rain', () => {
    const hourly = makeHourlyData(Array(12).fill({ precipitation: 0.5 }));
    // total = 6, max = 0.5
    expect(getFloodSeverity(hourly)).toBe('safe');
  });

  it('returns caution for moderate total rain', () => {
    const hourly = makeHourlyData(Array(12).fill({ precipitation: 2 }));
    // total = 24, max = 2
    expect(getFloodSeverity(hourly)).toBe('caution');
  });

  it('returns warning for heavy total rain', () => {
    const hourly = makeHourlyData(Array(12).fill({ precipitation: 4 }));
    // total = 48, max = 4
    expect(getFloodSeverity(hourly)).toBe('warning');
  });

  it('returns danger for extreme rainfall', () => {
    const hourly = makeHourlyData(Array(12).fill({ precipitation: 10 }));
    // total = 120, max = 10
    expect(getFloodSeverity(hourly)).toBe('danger');
  });

  it('triggers caution on high max even with low total', () => {
    const hourly = makeHourlyData([
      { precipitation: 14 },  // Just under 15 max threshold
      { precipitation: 1 },
      { precipitation: 1 },
    ]);
    // total = 16, max = 14
    expect(getFloodSeverity(hourly)).toBe('caution');
  });

  it('triggers warning when max >= 15 even with moderate total', () => {
    const hourly = makeHourlyData([
      { precipitation: 16 },
      { precipitation: 1 },
      { precipitation: 1 },
    ]);
    // total = 18, max = 16 — total < 30 but max >= 15 so not caution, total < 60 so warning
    expect(getFloodSeverity(hourly)).toBe('warning');
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
