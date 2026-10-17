import { describe, it, expect } from 'vitest';
import type { HourlyData } from '../hooks/useWeatherData';

import { getHourLabel, formatWindow, findBestAndWorstWindows } from '../utils/best-time';

function makeHourly(probs: number[]): HourlyData[] {
  return probs.map((prob, i) => ({
    time: `2026-08-14T${String(i).padStart(2, '0')}:00`,
    date: '2026-08-14',
    hour: i,
    temperature: 28,
    humidity: 80,
    precipitation: prob > 50 ? prob / 10 : 0,
    precipitation_probability: prob,
    wind_speed: 15,
    wind_gusts: 20,
    weather_code: 0,
    cloud_cover: 50,
    dew_point: 24,
    visibility: 10000,
    uv_index: 3,
  }));
}

describe('getHourLabel', () => {
  it('handles midnight', () => {
    expect(getHourLabel(0)).toBe('12 AM');
  });

  it('handles noon', () => {
    expect(getHourLabel(12)).toBe('12 PM');
  });

  it('handles morning hours', () => {
    expect(getHourLabel(1)).toBe('1 AM');
    expect(getHourLabel(6)).toBe('6 AM');
    expect(getHourLabel(11)).toBe('11 AM');
  });

  it('handles afternoon hours', () => {
    expect(getHourLabel(13)).toBe('1 PM');
    expect(getHourLabel(18)).toBe('6 PM');
    expect(getHourLabel(23)).toBe('11 PM');
  });
});

describe('formatWindow', () => {
  it('formats a normal 3-hour window', () => {
    expect(formatWindow(9, 12)).toBe('9 AM - 12 PM');
  });

  it('caps end at 11 PM when exceeding 23', () => {
    expect(formatWindow(22, 25)).toBe('10 PM - 11 PM');
  });

  it('formats midnight window', () => {
    expect(formatWindow(0, 3)).toBe('12 AM - 3 AM');
  });
});

describe('findBestAndWorstWindows (sliding window loop)', () => {
  it('returns null for less than 3 hours of data', () => {
    const hourly = makeHourly([50, 60]);
    expect(findBestAndWorstWindows(hourly)).toBeNull();
  });

  it('finds the best and worst windows with exactly 3 data points', () => {
    const hourly = makeHourly([20, 80, 40]);
    const result = findBestAndWorstWindows(hourly)!;
    // Only one window possible: avg = (20+80+40)/3 = 46.67
    expect(result.bestStart).toBe(0);
    expect(result.worstStart).toBe(0);
    expect(result.bestAvg).toBeCloseTo(46.67, 1);
    expect(result.worstAvg).toBeCloseTo(46.67, 1);
  });

  it('correctly identifies best window at the start', () => {
    // Low probs at start, high probs at end
    const hourly = makeHourly([10, 10, 10, 80, 90, 95]);
    const result = findBestAndWorstWindows(hourly)!;
    expect(result.bestStart).toBe(0);
    expect(result.bestAvg).toBe(10);
  });

  it('correctly identifies worst window at the end', () => {
    const hourly = makeHourly([10, 10, 10, 80, 90, 95]);
    const result = findBestAndWorstWindows(hourly)!;
    expect(result.worstStart).toBe(3);
    expect(result.worstAvg).toBeCloseTo(88.33, 1);
  });

  it('finds best window in the middle', () => {
    const hourly = makeHourly([70, 80, 5, 5, 5, 90, 95]);
    const result = findBestAndWorstWindows(hourly)!;
    expect(result.bestStart).toBe(2);
    expect(result.bestAvg).toBe(5);
  });

  it('handles all equal probabilities', () => {
    const hourly = makeHourly([50, 50, 50, 50, 50]);
    const result = findBestAndWorstWindows(hourly)!;
    expect(result.bestAvg).toBe(50);
    expect(result.worstAvg).toBe(50);
  });

  it('loops through a full 24-hour day', () => {
    // Simulate a full day: low in morning, high in afternoon
    const probs = Array.from({ length: 24 }, (_, i) =>
      i < 6 ? 10 : i < 12 ? 30 : i < 18 ? 80 : 60
    );
    const hourly = makeHourly(probs);
    const result = findBestAndWorstWindows(hourly)!;
    expect(result.bestStart).toBe(0); // Morning hours are lowest
    expect(result.bestAvg).toBe(10);
    expect(result.worstStart).toBe(12); // Afternoon is worst
    expect(result.worstAvg).toBe(80);
  });
});
