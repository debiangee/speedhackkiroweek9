import { describe, it, expect } from 'vitest';
import {
  computeWeatherFactor,
  computeSustainedRainBonus,
  computeSurgeScore,
  classifySurgeLevel,
  findBestWindow,
  findPeakWindow,
  computeTransportImpact,
  generateRecommendations,
  estimateSavings,
  getSurgeMultiplier,
  computeDaySurge,
  formatHour,
} from '../utils/surge-engine';
import type { HourlyData } from '../hooks/useWeatherData';

// Helper to create hourly data
function makeHourly(overrides: Partial<HourlyData> = {}, hour = 0): HourlyData {
  return {
    time: `2026-08-14T${String(hour).padStart(2, '0')}:00`,
    date: '2026-08-14',
    hour,
    temperature: 28,
    humidity: 80,
    precipitation: 0,
    precipitation_probability: 30,
    wind_speed: 10,
    wind_gusts: 15,
    weather_code: 0,
    cloud_cover: 50,
    dew_point: 22,
    visibility: 10000,
    uv_index: 5,
    ...overrides,
  };
}

describe('computeWeatherFactor', () => {
  it('returns 0 for perfect conditions', () => {
    const h = makeHourly({ precipitation_probability: 0, precipitation: 0, wind_speed: 0, visibility: 10000 });
    expect(computeWeatherFactor(h)).toBe(0);
  });

  it('returns high score for heavy rain', () => {
    const h = makeHourly({ precipitation_probability: 90, precipitation: 25, wind_speed: 40, visibility: 2000 });
    const score = computeWeatherFactor(h);
    expect(score).toBeGreaterThan(60);
  });

  it('maxes out at 100', () => {
    const h = makeHourly({ precipitation_probability: 100, precipitation: 50, wind_speed: 80, visibility: 0 });
    expect(computeWeatherFactor(h)).toBeLessThanOrEqual(100);
  });

  it('applies thunderstorm multiplier for codes 95-99', () => {
    const normal = makeHourly({ precipitation_probability: 60, precipitation: 10, wind_speed: 20, visibility: 5000 });
    const storm = { ...normal, weather_code: 95 };

    const normalScore = computeWeatherFactor(normal);
    const stormScore = computeWeatherFactor(storm);

    expect(stormScore).toBeGreaterThan(normalScore);
    expect(stormScore).toBeLessThanOrEqual(100);
  });

  it('does not apply thunderstorm multiplier for code 94', () => {
    const h = makeHourly({ precipitation_probability: 60, precipitation: 10, weather_code: 94 });
    const hStorm = { ...h, weather_code: 95 };
    expect(computeWeatherFactor(hStorm)).toBeGreaterThan(computeWeatherFactor(h));
  });

  it('adds AQI bonus', () => {
    const h = makeHourly({ precipitation_probability: 30, precipitation: 2 });
    const withoutAqi = computeWeatherFactor(h, 0);
    const withAqi = computeWeatherFactor(h, 20);
    expect(withAqi).toBe(withoutAqi + 20);
  });

  it('caps AQI bonus at 100', () => {
    const h = makeHourly({ precipitation_probability: 90, precipitation: 25, wind_speed: 50, visibility: 1000 });
    const score = computeWeatherFactor(h, 50);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('handles missing visibility gracefully', () => {
    const h = makeHourly({ visibility: undefined as unknown as number });
    // Should use default 10000 → visibility score = 0
    const score = computeWeatherFactor(h);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('computeSustainedRainBonus', () => {
  it('returns 0 when no sustained rain', () => {
    const hourly = [
      makeHourly({ precipitation_probability: 20 }, 0),
      makeHourly({ precipitation_probability: 70 }, 1),
      makeHourly({ precipitation_probability: 20 }, 2),
      makeHourly({ precipitation_probability: 70 }, 3),
      makeHourly({ precipitation_probability: 20 }, 4),
    ];
    expect(computeSustainedRainBonus(hourly, 2)).toBe(0);
  });

  it('returns 15 for 3+ consecutive hours above 60%', () => {
    const hourly = [
      makeHourly({ precipitation_probability: 70 }, 0),
      makeHourly({ precipitation_probability: 80 }, 1),
      makeHourly({ precipitation_probability: 65 }, 2),
      makeHourly({ precipitation_probability: 90 }, 3),
      makeHourly({ precipitation_probability: 20 }, 4),
    ];
    expect(computeSustainedRainBonus(hourly, 1)).toBe(15);
  });

  it('returns 0 if only 2 consecutive hours', () => {
    const hourly = [
      makeHourly({ precipitation_probability: 70 }, 0),
      makeHourly({ precipitation_probability: 80 }, 1),
      makeHourly({ precipitation_probability: 20 }, 2),
      makeHourly({ precipitation_probability: 70 }, 3),
    ];
    expect(computeSustainedRainBonus(hourly, 0)).toBe(0);
  });
});

describe('computeSurgeScore', () => {
  it('weights weather at 60% and temporal at 40%', () => {
    // Weather 100, temporal 0 → 60
    expect(computeSurgeScore(100, 0, 0)).toBe(60);
    // Weather 0, temporal 100 → 40
    expect(computeSurgeScore(0, 100, 0)).toBe(40);
  });

  it('adds sustained bonus', () => {
    expect(computeSurgeScore(50, 50, 15)).toBe(65); // 30 + 20 + 15
  });

  it('clamps to 100', () => {
    expect(computeSurgeScore(100, 100, 15)).toBe(100);
  });

  it('clamps to 0', () => {
    expect(computeSurgeScore(0, 0, 0)).toBe(0);
  });
});

describe('classifySurgeLevel', () => {
  it('classifies LOW for 0-25', () => {
    expect(classifySurgeLevel(0)).toBe('LOW');
    expect(classifySurgeLevel(25)).toBe('LOW');
  });

  it('classifies MODERATE for 26-50', () => {
    expect(classifySurgeLevel(26)).toBe('MODERATE');
    expect(classifySurgeLevel(50)).toBe('MODERATE');
  });

  it('classifies HIGH for 51-75', () => {
    expect(classifySurgeLevel(51)).toBe('HIGH');
    expect(classifySurgeLevel(75)).toBe('HIGH');
  });

  it('classifies EXTREME for 76-100', () => {
    expect(classifySurgeLevel(76)).toBe('EXTREME');
    expect(classifySurgeLevel(100)).toBe('EXTREME');
  });
});

describe('findBestWindow', () => {
  it('returns null when no window below threshold', () => {
    const results = Array.from({ length: 24 }, (_, i) => ({
      hour: i, score: 50, level: 'MODERATE' as const,
      weatherFactor: 40, temporalFactor: 40, sustainedBonus: 0, topFactor: 'weather' as const,
    }));
    expect(findBestWindow(results)).toBeNull();
  });

  it('finds the longest low-score stretch', () => {
    const results = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      score: i >= 2 && i <= 6 ? 15 : 50, // Hours 2-6 are low
      level: (i >= 2 && i <= 6 ? 'LOW' : 'MODERATE') as any,
      weatherFactor: 30, temporalFactor: 30, sustainedBonus: 0, topFactor: 'weather' as const,
    }));

    const window = findBestWindow(results);
    expect(window).not.toBeNull();
    expect(window!.startHour).toBe(2);
    expect(window!.endHour).toBe(6);
    expect(window!.length).toBe(5);
  });

  it('requires minimum 2 hours', () => {
    const results = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      score: i === 5 ? 10 : 60, // Only 1 hour low
      level: 'HIGH' as const,
      weatherFactor: 40, temporalFactor: 40, sustainedBonus: 0, topFactor: 'weather' as const,
    }));
    expect(findBestWindow(results)).toBeNull();
  });
});

describe('findPeakWindow', () => {
  it('finds the highest average stretch', () => {
    const results = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      score: i >= 17 && i <= 19 ? 85 : 20, // Evening peak
      level: (i >= 17 && i <= 19 ? 'EXTREME' : 'LOW') as any,
      weatherFactor: 60, temporalFactor: 60, sustainedBonus: 0, topFactor: 'rush_hour' as const,
    }));

    const window = findPeakWindow(results);
    expect(window).not.toBeNull();
    expect(window!.startHour).toBe(17);
    expect(window!.endHour).toBe(19);
    expect(window!.avgScore).toBe(85);
  });

  it('returns null for less than 2 results', () => {
    expect(findPeakWindow([{
      hour: 0, score: 80, level: 'EXTREME',
      weatherFactor: 60, temporalFactor: 60, sustainedBonus: 0, topFactor: 'weather',
    }])).toBeNull();
  });
});

describe('computeTransportImpact', () => {
  it('returns 4 transport modes', () => {
    const h = makeHourly();
    const impacts = computeTransportImpact(h, 30, 'MODERATE');
    expect(impacts).toHaveLength(4);
    expect(impacts.map((i) => i.mode)).toEqual(['grab', 'angkas', 'jeepney', 'walking']);
  });

  it('marks angkas as Very Limited in high wind', () => {
    const h = makeHourly({ wind_speed: 45 });
    const impacts = computeTransportImpact(h, 60, 'HIGH');
    const angkas = impacts.find((i) => i.mode === 'angkas')!;
    expect(angkas.status).toBe('Very Limited');
    expect(angkas.severity).toBe('severe');
  });

  it('marks jeepney as delayed for high precip prob', () => {
    const h = makeHourly({ precipitation_probability: 80 });
    const impacts = computeTransportImpact(h, 60, 'HIGH');
    const jeepney = impacts.find((i) => i.mode === 'jeepney')!;
    expect(jeepney.status).toBe('Delayed / Rerouted');
  });

  it('marks walking as not recommended in rain', () => {
    const h = makeHourly({ precipitation: 5 });
    const impacts = computeTransportImpact(h, 40, 'MODERATE');
    const walking = impacts.find((i) => i.mode === 'walking')!;
    expect(walking.status).toBe('Not Recommended');
  });

  it('marks all good in clear conditions', () => {
    const h = makeHourly({ precipitation_probability: 10, precipitation: 0, wind_speed: 10 });
    const impacts = computeTransportImpact(h, 15, 'LOW');
    expect(impacts.every((i) => i.severity === 'good')).toBe(true);
  });
});

describe('estimateSavings', () => {
  it('returns 0 when future is same or worse', () => {
    expect(estimateSavings('LOW', 'MODERATE')).toBe(0);
    expect(estimateSavings('HIGH', 'HIGH')).toBe(0);
  });

  it('estimates savings from EXTREME to LOW', () => {
    const savings = estimateSavings('EXTREME', 'LOW');
    // (3.2 - 1.0) / 3.2 * 100 = 68.75 → rounded to 70
    expect(savings).toBe(70);
  });

  it('estimates savings from HIGH to LOW', () => {
    const savings = estimateSavings('HIGH', 'LOW');
    // (2.0 - 1.0) / 2.0 * 100 = 50 → 50
    expect(savings).toBe(50);
  });

  it('rounds to nearest 5', () => {
    const savings = estimateSavings('MODERATE', 'LOW');
    // (1.4 - 1.0) / 1.4 * 100 = 28.57 → 30
    expect(savings % 5).toBe(0);
  });
});

describe('generateRecommendations', () => {
  it('returns empty for empty results', () => {
    expect(generateRecommendations([], 12, [])).toEqual([]);
  });

  it('recommends book now when surge is coming', () => {
    const results = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      score: i >= 13 ? 65 : 20,
      level: (i >= 13 ? 'HIGH' : 'LOW') as any,
      weatherFactor: 40, temporalFactor: 40, sustainedBonus: 0, topFactor: 'weather' as const,
    }));
    const hourly = Array.from({ length: 24 }, (_, i) => makeHourly({}, i));

    const recs = generateRecommendations(results, 12, hourly);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].action).toBe('book_now');
  });

  it('recommends wait when currently in surge', () => {
    const results = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      score: i >= 12 && i <= 15 ? 70 : 20,
      level: (i >= 12 && i <= 15 ? 'HIGH' : 'LOW') as any,
      weatherFactor: 50, temporalFactor: 50, sustainedBonus: 0, topFactor: 'rush_hour' as const,
    }));
    const hourly = Array.from({ length: 24 }, (_, i) => makeHourly({}, i));

    const recs = generateRecommendations(results, 12, hourly);
    const waitRec = recs.find((r) => r.action === 'wait');
    expect(waitRec).toBeDefined();
  });

  it('caps at 3 recommendations', () => {
    const results = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      score: i % 3 === 0 ? 70 : 10,
      level: (i % 3 === 0 ? 'HIGH' : 'LOW') as any,
      weatherFactor: 40, temporalFactor: 40, sustainedBonus: 0, topFactor: 'weather' as const,
    }));
    const hourly = Array.from({ length: 24 }, (_, i) => makeHourly({ precipitation_probability: 5 }, i));

    const recs = generateRecommendations(results, 0, hourly);
    expect(recs.length).toBeLessThanOrEqual(3);
  });
});

describe('computeDaySurge', () => {
  it('computes surge for a full day', () => {
    const hourly = Array.from({ length: 24 }, (_, i) => makeHourly({
      precipitation_probability: i >= 17 && i <= 19 ? 80 : 10,
    }, i));

    const date = new Date('2026-08-14T00:00:00'); // Friday (weekday)
    const results = computeDaySurge(hourly, date);

    expect(results).toHaveLength(24);
    // Evening rush + rain should produce higher scores
    const eveningScores = results.filter((r) => r.hour >= 17 && r.hour <= 19);
    const morningScores = results.filter((r) => r.hour >= 1 && r.hour <= 4);
    expect(eveningScores[0].score).toBeGreaterThan(morningScores[0].score);
  });

  it('applies AQI bonuses when provided', () => {
    const hourly = Array.from({ length: 24 }, (_, i) => makeHourly({}, i));
    const aqiBonuses = Array.from({ length: 24 }, () => 20);

    const date = new Date('2026-08-14T00:00:00');
    const withAqi = computeDaySurge(hourly, date, aqiBonuses);
    const withoutAqi = computeDaySurge(hourly, date);

    expect(withAqi[12].score).toBeGreaterThan(withoutAqi[12].score);
  });
});

describe('formatHour', () => {
  it('formats correctly', () => {
    expect(formatHour(0)).toBe('12 AM');
    expect(formatHour(12)).toBe('12 PM');
    expect(formatHour(7)).toBe('7 AM');
    expect(formatHour(18)).toBe('6 PM');
  });
});

describe('getSurgeMultiplier', () => {
  it('returns correct multipliers', () => {
    expect(getSurgeMultiplier('LOW')).toBe(1.0);
    expect(getSurgeMultiplier('MODERATE')).toBe(1.4);
    expect(getSurgeMultiplier('HIGH')).toBe(2.0);
    expect(getSurgeMultiplier('EXTREME')).toBe(3.2);
  });
});
