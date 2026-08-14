/**
 * Trip Go Checker — Verdict Engine
 * 
 * Computes a Weather_Score (0–100) from weighted signals:
 * - Precipitation probability: 40%
 * - Total precipitation (mm): 25%
 * - Wind speed (km/h): 20%
 * - Visibility (m): 15%
 * 
 * Verdict thresholds:
 * - GO: score >= 70
 * - CAUTION: 40 <= score <= 69
 * - NO-GO: score < 40
 */

import type { HourlyData } from '../hooks/useWeatherData';

export type TripVerdict = 'GO' | 'CAUTION' | 'NO-GO';

export interface VerdictResult {
  verdict: TripVerdict;
  score: number;
  summary: string;
  primaryFactor: string;
  metrics: {
    avgRainProb: number;
    totalRain: number;
    avgWind: number;
    avgVisibility: number;
  };
  subScores: {
    rain_prob: number;
    precipitation: number;
    wind: number;
    visibility: number;
  };
}

export interface TravelWindow {
  startHour: number;
  endHour: number;
  score: number;
}

export interface TripAdviceItem {
  text: string;
  type: 'info' | 'warning' | 'danger';
}

// --- Sub-score functions (each returns 0–100, clamped) ---

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function scoreRainProb(avgProb: number): number {
  // 0% = 100, 100% = 0 (inverse linear)
  return clamp(100 - avgProb);
}

function scorePrecipitation(totalMm: number): number {
  // 0mm = 100, 50mm+ = 0 (inverse linear on 0–50 scale)
  return clamp(100 - (totalMm / 50) * 100);
}

function scoreWind(avgKmh: number): number {
  // 0 km/h = 100, 80+ km/h = 0 (inverse linear on 0–80 scale)
  return clamp(100 - (avgKmh / 80) * 100);
}

function scoreVisibility(avgMeters: number): number {
  // 0m = 0, 10000m+ = 100 (linear on 0–10000 scale)
  return clamp((avgMeters / 10000) * 100);
}

// --- Primary factor detection ---

function findPrimaryFactor(subScores: VerdictResult['subScores']): string {
  const weighted = {
    'Rain probability': subScores.rain_prob * 0.4,
    'Total rainfall': subScores.precipitation * 0.25,
    'Wind speed': subScores.wind * 0.2,
    'Low visibility': subScores.visibility * 0.15,
  };

  let lowest = Infinity;
  let factor = 'Rain probability';
  for (const [key, val] of Object.entries(weighted)) {
    if (val < lowest) {
      lowest = val;
      factor = key;
    }
  }
  return factor;
}

// --- Summary generation ---

function generateSummary(verdict: TripVerdict, primaryFactor: string, metrics: VerdictResult['metrics']): string {
  if (verdict === 'GO') {
    return 'Weather conditions are favorable for travel. Enjoy your trip!';
  }
  if (verdict === 'CAUTION') {
    if (primaryFactor === 'Rain probability') {
      return `${Math.round(metrics.avgRainProb)}% chance of rain — prepare accordingly.`;
    }
    if (primaryFactor === 'Wind speed') {
      return `Moderate winds at ${Math.round(metrics.avgWind)} km/h may affect travel.`;
    }
    if (primaryFactor === 'Total rainfall') {
      return `Expected ${metrics.totalRain.toFixed(1)}mm rainfall — bring rain gear.`;
    }
    return 'Mixed conditions — travel with caution and prepare for changes.';
  }
  // NO-GO
  if (primaryFactor === 'Rain probability') {
    return `${Math.round(metrics.avgRainProb)}% rain chance — not safe for travel.`;
  }
  if (primaryFactor === 'Total rainfall') {
    return `Heavy rainfall (${metrics.totalRain.toFixed(1)}mm) expected — avoid travel.`;
  }
  if (primaryFactor === 'Wind speed') {
    return `Dangerous winds at ${Math.round(metrics.avgWind)} km/h — stay indoors.`;
  }
  return 'Poor visibility and severe conditions — postpone your trip.';
}

// --- Main verdict computation ---

export function computeVerdict(hourly: HourlyData[]): VerdictResult | null {
  if (hourly.length === 0) return null;

  const avgRainProb = hourly.reduce((s, h) => s + h.precipitation_probability, 0) / hourly.length;
  const totalRain = hourly.reduce((s, h) => s + h.precipitation, 0);
  const avgWind = hourly.reduce((s, h) => s + h.wind_speed, 0) / hourly.length;
  const avgVisibility = hourly.reduce((s, h) => s + (h.visibility || 10000), 0) / hourly.length;

  const subScores = {
    rain_prob: clamp(scoreRainProb(avgRainProb)),
    precipitation: clamp(scorePrecipitation(totalRain)),
    wind: clamp(scoreWind(avgWind)),
    visibility: clamp(scoreVisibility(avgVisibility)),
  };

  const rawScore =
    subScores.rain_prob * 0.4 +
    subScores.precipitation * 0.25 +
    subScores.wind * 0.2 +
    subScores.visibility * 0.15;

  const score = Math.round(rawScore);

  let verdict: TripVerdict;
  if (score >= 70) verdict = 'GO';
  else if (score >= 40) verdict = 'CAUTION';
  else verdict = 'NO-GO';

  const metrics = {
    avgRainProb: Math.round(avgRainProb * 10) / 10,
    totalRain: Math.round(totalRain * 10) / 10,
    avgWind: Math.round(avgWind * 10) / 10,
    avgVisibility: Math.round(avgVisibility),
  };

  const primaryFactor = findPrimaryFactor(subScores);
  const summary = generateSummary(verdict, primaryFactor, metrics);

  return { verdict, score, summary, primaryFactor, metrics, subScores };
}

// --- Travel window computation ---

function computeHourScore(h: HourlyData): number {
  const rp = clamp(scoreRainProb(h.precipitation_probability));
  const precip = clamp(100 - (h.precipitation / 2) * 100); // 0mm=100, 2mm+=0 per hour
  const wi = clamp(scoreWind(h.wind_speed));
  const vi = clamp(scoreVisibility(h.visibility || 10000));

  return rp * 0.4 + precip * 0.25 + wi * 0.2 + vi * 0.15;
}

export function findTravelWindows(hourly: HourlyData[]): { best: TravelWindow | null; worst: TravelWindow | null; allBad: boolean } {
  if (hourly.length < 3) return { best: null, worst: null, allBad: false };

  let bestStart = 0;
  let bestScore = -1;
  let worstStart = 0;
  let worstScore = Infinity;
  let allBad = true;

  for (let i = 0; i <= hourly.length - 3; i++) {
    const windowScore = (
      computeHourScore(hourly[i]) +
      computeHourScore(hourly[i + 1]) +
      computeHourScore(hourly[i + 2])
    ) / 3;

    if (windowScore >= 40) allBad = false;

    if (windowScore > bestScore) {
      bestScore = windowScore;
      bestStart = i;
    }
    if (windowScore < worstScore) {
      worstScore = windowScore;
      worstStart = i;
    }
  }

  return {
    best: { startHour: hourly[bestStart].hour, endHour: hourly[bestStart + 2].hour, score: Math.round(bestScore) },
    worst: { startHour: hourly[worstStart].hour, endHour: hourly[worstStart + 2].hour, score: Math.round(worstScore) },
    allBad,
  };
}

// --- Practical advice ---

export function getTripAdvice(verdict: TripVerdict, hourly: HourlyData[]): TripAdviceItem[] {
  const items: TripAdviceItem[] = [];

  if (verdict === 'GO') {
    items.push({ text: 'Don\'t forget sunscreen if outdoors', type: 'info' });
    items.push({ text: 'Stay hydrated — bring water', type: 'info' });
    items.push({ text: 'Rain gear is optional today', type: 'info' });
  } else if (verdict === 'CAUTION') {
    items.push({ text: 'Bring an umbrella', type: 'warning' });
    items.push({ text: 'Wear waterproof footwear', type: 'warning' });
    items.push({ text: 'Have an indoor backup plan', type: 'warning' });
    items.push({ text: 'Check forecast updates before leaving', type: 'warning' });
  } else {
    items.push({ text: 'Postpone your trip if possible', type: 'danger' });
    items.push({ text: 'Use heavy rain gear if travel is unavoidable', type: 'danger' });
    items.push({ text: 'Avoid flood-prone routes', type: 'danger' });
    items.push({ text: 'Monitor weather alerts from PAGASA', type: 'danger' });
  }

  // Wind advisory regardless of verdict
  const maxWind = Math.max(...hourly.map((h) => h.wind_speed), 0);
  if (maxWind > 40) {
    items.push({
      text: `Wind advisory: gusts up to ${Math.round(maxWind)} km/h — secure loose belongings`,
      type: 'danger',
    });
  }

  return items;
}
