import { describe, it, expect } from 'vitest';
import { getRainSeverity, getProbabilitySeverity } from '../utils/rain-severity';

describe('getRainSeverity', () => {
  it('returns "none" for zero precip and low probability', () => {
    const result = getRainSeverity(0, 10);
    expect(result.level).toBe('none');
    expect(result.label).toBe('Clear');
  });

  it('returns "light" for low precip', () => {
    const result = getRainSeverity(1.5, 30);
    expect(result.level).toBe('light');
  });

  it('returns "moderate" for mid-range precip', () => {
    const result = getRainSeverity(5, 50);
    expect(result.level).toBe('moderate');
  });

  it('returns "heavy" for high precip', () => {
    const result = getRainSeverity(10, 75);
    expect(result.level).toBe('heavy');
  });

  it('returns "extreme" for very high precip and probability', () => {
    const result = getRainSeverity(20, 90);
    expect(result.level).toBe('extreme');
  });

  it('uses probability threshold when precip is zero', () => {
    // precip = 0 but probability >= 20 triggers light
    const result = getRainSeverity(0, 25);
    expect(result.level).toBe('light');
  });

  it('returns correct colors for each severity', () => {
    expect(getRainSeverity(0, 5).color).toBe('#4caf50');
    expect(getRainSeverity(1, 30).color).toBe('#66bb6a');
    expect(getRainSeverity(5, 50).color).toBe('#ffa726');
    expect(getRainSeverity(10, 75).color).toBe('#ef5350');
    expect(getRainSeverity(20, 90).color).toBe('#b71c1c');
  });
});

describe('getProbabilitySeverity', () => {
  it('maps probability < 20 to none', () => {
    expect(getProbabilitySeverity(0).level).toBe('none');
    expect(getProbabilitySeverity(19).level).toBe('none');
  });

  it('maps probability 20-39 to light', () => {
    expect(getProbabilitySeverity(20).level).toBe('light');
    expect(getProbabilitySeverity(39).level).toBe('light');
  });

  it('maps probability 40-64 to moderate', () => {
    expect(getProbabilitySeverity(40).level).toBe('moderate');
    expect(getProbabilitySeverity(64).level).toBe('moderate');
  });

  it('maps probability 65-84 to heavy', () => {
    expect(getProbabilitySeverity(65).level).toBe('heavy');
    expect(getProbabilitySeverity(84).level).toBe('heavy');
  });

  it('maps probability >= 85 to extreme', () => {
    expect(getProbabilitySeverity(85).level).toBe('extreme');
    expect(getProbabilitySeverity(100).level).toBe('extreme');
  });

  it('iterates correctly at boundary values', () => {
    // Exact boundary transitions
    expect(getProbabilitySeverity(19).level).toBe('none');
    expect(getProbabilitySeverity(20).level).toBe('light');
    expect(getProbabilitySeverity(39).level).toBe('light');
    expect(getProbabilitySeverity(40).level).toBe('moderate');
    expect(getProbabilitySeverity(64).level).toBe('moderate');
    expect(getProbabilitySeverity(65).level).toBe('heavy');
    expect(getProbabilitySeverity(84).level).toBe('heavy');
    expect(getProbabilitySeverity(85).level).toBe('extreme');
  });
});
