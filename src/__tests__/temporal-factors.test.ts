import { describe, it, expect } from 'vitest';
import {
  RUSH_HOUR_CURVE,
  isHoliday,
  isHolidayEve,
  isPayday,
  getPaydayBoost,
  getDayTypeMultiplier,
  computeTemporalFactor,
} from '../utils/temporal-factors';

describe('RUSH_HOUR_CURVE', () => {
  it('has 24 entries', () => {
    expect(RUSH_HOUR_CURVE).toHaveLength(24);
  });

  it('peaks at morning rush (7-8 AM)', () => {
    expect(RUSH_HOUR_CURVE[7]).toBeGreaterThanOrEqual(90);
    expect(RUSH_HOUR_CURVE[8]).toBe(100);
  });

  it('peaks at evening rush (6-7 PM)', () => {
    expect(RUSH_HOUR_CURVE[18]).toBeGreaterThanOrEqual(90);
    expect(RUSH_HOUR_CURVE[19]).toBe(100);
  });

  it('is low during early morning (0-4 AM)', () => {
    for (let i = 0; i <= 4; i++) {
      expect(RUSH_HOUR_CURVE[i]).toBeLessThanOrEqual(15);
    }
  });
});

describe('isPayday', () => {
  it('returns true for 15th of any month', () => {
    expect(isPayday(new Date('2026-08-15'))).toBe(true);
    expect(isPayday(new Date('2026-01-15'))).toBe(true);
  });

  it('returns true for last day of month', () => {
    expect(isPayday(new Date('2026-08-31'))).toBe(true);
    expect(isPayday(new Date('2026-09-30'))).toBe(true);
    expect(isPayday(new Date('2026-02-28'))).toBe(true);
  });

  it('returns false for regular days', () => {
    expect(isPayday(new Date('2026-08-14'))).toBe(false);
    expect(isPayday(new Date('2026-08-20'))).toBe(false);
  });
});

describe('getPaydayBoost', () => {
  it('returns 20 on payday', () => {
    expect(getPaydayBoost(new Date('2026-08-15'))).toBe(20);
  });

  it('returns 10 day before payday', () => {
    expect(getPaydayBoost(new Date('2026-08-14'))).toBe(10); // day before 15th
  });

  it('returns 10 day after payday', () => {
    expect(getPaydayBoost(new Date('2026-08-16'))).toBe(10); // day after 15th
  });

  it('returns 0 on regular days', () => {
    expect(getPaydayBoost(new Date('2026-08-10'))).toBe(0);
    expect(getPaydayBoost(new Date('2026-08-20'))).toBe(0);
  });
});

describe('isHoliday', () => {
  it('returns true for Christmas Day', () => {
    expect(isHoliday(new Date('2026-12-25'))).toBe(true);
  });

  it('returns true for New Year', () => {
    expect(isHoliday(new Date('2026-01-01'))).toBe(true);
  });

  it('returns true for Independence Day', () => {
    expect(isHoliday(new Date('2026-06-12'))).toBe(true);
  });

  it('returns false for regular day', () => {
    expect(isHoliday(new Date('2026-08-14'))).toBe(false);
  });
});

describe('isHolidayEve', () => {
  it('returns true for Christmas Eve', () => {
    expect(isHolidayEve(new Date('2026-12-24'))).toBe(true);
  });

  it('returns true for day before New Year', () => {
    expect(isHolidayEve(new Date('2026-12-31'))).toBe(true);
  });

  it('returns false for regular day', () => {
    expect(isHolidayEve(new Date('2026-08-13'))).toBe(false);
  });
});

describe('getDayTypeMultiplier', () => {
  it('returns 1.0 for weekday', () => {
    // Aug 14, 2026 = Friday
    expect(getDayTypeMultiplier(new Date('2026-08-14'))).toBe(1.0);
    // Aug 11, 2026 = Tuesday
    expect(getDayTypeMultiplier(new Date('2026-08-11'))).toBe(1.0);
  });

  it('returns 0.7 for Saturday', () => {
    // Aug 15, 2026 = Saturday
    expect(getDayTypeMultiplier(new Date('2026-08-15'))).toBe(0.7);
  });

  it('returns 0.5 for Sunday', () => {
    // Aug 16, 2026 = Sunday
    expect(getDayTypeMultiplier(new Date('2026-08-16'))).toBe(0.5);
  });

  it('returns 0.4 for holiday', () => {
    // Dec 25, 2026 = Christmas (Thursday)
    expect(getDayTypeMultiplier(new Date('2026-12-25'))).toBe(0.4);
  });

  it('returns 0.8 for holiday eve', () => {
    // Jun 11, 2026 = Thursday, day before Independence Day (Jun 12)
    expect(getDayTypeMultiplier(new Date('2026-06-11'))).toBe(0.8);
  });
});

describe('computeTemporalFactor', () => {
  it('returns higher value during rush hour on weekday', () => {
    const weekday = new Date('2026-08-11'); // Tuesday
    const rushScore = computeTemporalFactor(8, weekday); // 8 AM peak
    const nightScore = computeTemporalFactor(2, weekday); // 2 AM quiet

    expect(rushScore).toBeGreaterThan(nightScore);
  });

  it('returns lower on weekend vs weekday at same hour', () => {
    const weekday = new Date('2026-08-11'); // Tuesday
    const sunday = new Date('2026-08-16'); // Sunday

    const weekdayScore = computeTemporalFactor(8, weekday);
    const sundayScore = computeTemporalFactor(8, sunday);

    expect(weekdayScore).toBeGreaterThan(sundayScore);
  });

  it('adds payday boost', () => {
    const payday = new Date('2026-08-15'); // 15th (Saturday)
    const regular = new Date('2026-08-08'); // Regular Saturday

    const paydayScore = computeTemporalFactor(12, payday);
    const regularScore = computeTemporalFactor(12, regular);

    expect(paydayScore).toBeGreaterThan(regularScore);
  });

  it('stays within 0-100 range', () => {
    // Test all hours on a weekday payday
    const payday = new Date('2026-01-15'); // Thursday
    for (let h = 0; h < 24; h++) {
      const score = computeTemporalFactor(h, payday);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});
