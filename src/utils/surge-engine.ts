// Transport Surge Prediction Engine
// Pure computation logic — no React, no side effects, fully testable

import type { HourlyData } from '../hooks/useWeatherData';
import { computeTemporalFactor, RUSH_HOUR_CURVE } from './temporal-factors';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SurgeLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface SurgeResult {
  hour: number;
  score: number;
  level: SurgeLevel;
  weatherFactor: number;
  temporalFactor: number;
  sustainedBonus: number;
  topFactor: 'weather' | 'rush_hour' | 'payday' | 'sustained_rain';
}

export interface SurgeWindow {
  startHour: number;
  endHour: number;
  avgScore: number;
  length: number;
}

export interface TransportImpact {
  mode: 'grab' | 'angkas' | 'jeepney' | 'walking';
  label: string;
  status: string;
  severity: 'good' | 'moderate' | 'poor' | 'severe';
  tip: string;
  multiplier?: string;
}

export interface Recommendation {
  priority: number;
  action: 'book_now' | 'wait' | 'switch_mode';
  title: string;
  description: string;
  savings: number; // percentage, rounded to nearest 5
  confidence: 'high' | 'moderate' | 'low';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ─── Surge Level Classification ──────────────────────────────────────────────

export function classifySurgeLevel(score: number): SurgeLevel {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MODERATE';
  if (score <= 75) return 'HIGH';
  return 'EXTREME';
}

// ─── Surge Multiplier Estimates ──────────────────────────────────────────────

const SURGE_MULTIPLIERS: Record<SurgeLevel, number> = {
  LOW: 1.0,
  MODERATE: 1.4,
  HIGH: 2.0,
  EXTREME: 3.2,
};

export function getSurgeMultiplier(level: SurgeLevel): number {
  return SURGE_MULTIPLIERS[level];
}

export function getMultiplierLabel(level: SurgeLevel): string {
  switch (level) {
    case 'LOW': return '1x Normal';
    case 'MODERATE': return '1.3–1.5x';
    case 'HIGH': return '1.5–2.5x';
    case 'EXTREME': return '2.5–4x+';
  }
}

// ─── Weather Factor ──────────────────────────────────────────────────────────

export function computeWeatherFactor(h: HourlyData, aqiBonus = 0): number {
  // Sub-scores: higher = more surge-inducing
  const precipProbScore = clamp(h.precipitation_probability, 0, 100);
  const precipAmountScore = clamp((h.precipitation / 30) * 100, 0, 100);
  const windScore = clamp((h.wind_speed / 60) * 100, 0, 100);
  const visibilityScore = clamp(((10000 - (h.visibility ?? 10000)) / 10000) * 100, 0, 100);

  let weatherFactor = (
    precipProbScore * 0.35 +
    precipAmountScore * 0.30 +
    windScore * 0.20 +
    visibilityScore * 0.15
  );

  // Thunderstorm multiplier (WMO codes 95-99)
  if (h.weather_code >= 95 && h.weather_code <= 99) {
    weatherFactor = Math.min(weatherFactor * 1.5, 100);
  }

  // Air quality bonus
  weatherFactor = Math.min(weatherFactor + aqiBonus, 100);

  return Math.round(weatherFactor);
}

// ─── Sustained Rain Bonus ────────────────────────────────────────────────────

export function computeSustainedRainBonus(hourly: HourlyData[], hourIndex: number): number {
  // Check for 3+ consecutive hours with precip prob > 60% around this hour
  let maxConsecutive = 0;
  let current = 0;

  const start = Math.max(0, hourIndex - 2);
  const end = Math.min(hourly.length - 1, hourIndex + 2);

  for (let i = start; i <= end; i++) {
    if (hourly[i].precipitation_probability > 60) {
      current++;
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 0;
    }
  }

  return maxConsecutive >= 3 ? 15 : 0;
}

// ─── Surge Score Computation ─────────────────────────────────────────────────

export function computeSurgeScore(
  weatherFactor: number,
  temporalFactor: number,
  sustainedBonus: number
): number {
  const raw = (weatherFactor * 0.60) + (temporalFactor * 0.40) + sustainedBonus;
  return Math.round(clamp(raw, 0, 100));
}

// ─── Full Day Surge Computation ──────────────────────────────────────────────

export function computeDaySurge(
  hourly: HourlyData[],
  date: Date,
  aqiBonuses: number[] = []
): SurgeResult[] {
  return hourly.map((h, i) => {
    const aqiBonus = aqiBonuses[i] ?? 0;
    const weatherFactor = computeWeatherFactor(h, aqiBonus);
    const temporalFactor = computeTemporalFactor(h.hour, date);
    const sustainedBonus = computeSustainedRainBonus(hourly, i);
    const score = computeSurgeScore(weatherFactor, temporalFactor, sustainedBonus);
    const level = classifySurgeLevel(score);

    // Determine top factor inline (avoid dynamic require)
    let topFactor: SurgeResult['topFactor'] = 'weather';
    const weatherContrib = weatherFactor * 0.60;
    const rushContrib = RUSH_HOUR_CURVE[h.hour] * 0.50 * 0.40;
    if (sustainedBonus > 0 && sustainedBonus >= rushContrib) {
      topFactor = 'sustained_rain';
    } else if (rushContrib > weatherContrib) {
      topFactor = 'rush_hour';
    }

    return {
      hour: h.hour,
      score,
      level,
      weatherFactor,
      temporalFactor,
      sustainedBonus,
      topFactor,
    };
  });
}

// ─── Window Detection ────────────────────────────────────────────────────────

/**
 * Find the longest contiguous stretch of hours with scores below threshold
 * (the "cheapest window" / best time to book)
 */
export function findBestWindow(results: SurgeResult[], threshold = 30): SurgeWindow | null {
  let bestWindow: SurgeWindow | null = null;
  let currentStart = -1;
  let currentLength = 0;
  let currentSum = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i].score < threshold) {
      if (currentStart === -1) currentStart = i;
      currentLength++;
      currentSum += results[i].score;
    } else {
      if (currentLength >= 2 && (!bestWindow || currentLength > bestWindow.length)) {
        bestWindow = {
          startHour: results[currentStart].hour,
          endHour: results[currentStart + currentLength - 1].hour,
          avgScore: Math.round(currentSum / currentLength),
          length: currentLength,
        };
      }
      currentStart = -1;
      currentLength = 0;
      currentSum = 0;
    }
  }

  // Check final run
  if (currentLength >= 2 && (!bestWindow || currentLength > bestWindow.length)) {
    bestWindow = {
      startHour: results[currentStart].hour,
      endHour: results[currentStart + currentLength - 1].hour,
      avgScore: Math.round(currentSum / currentLength),
      length: currentLength,
    };
  }

  return bestWindow;
}

/**
 * Find the contiguous stretch of 2+ hours with the highest average score
 * (the "peak surge window" / avoid booking)
 */
export function findPeakWindow(results: SurgeResult[]): SurgeWindow | null {
  if (results.length < 2) return null;

  let bestWindow: SurgeWindow | null = null;
  let bestAvg = 0;

  // Sliding window approach: try all contiguous runs above MODERATE (>25)
  let currentStart = -1;
  let currentLength = 0;
  let currentSum = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i].score > 25) {
      if (currentStart === -1) currentStart = i;
      currentLength++;
      currentSum += results[i].score;
    } else {
      if (currentLength >= 2) {
        const avg = currentSum / currentLength;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestWindow = {
            startHour: results[currentStart].hour,
            endHour: results[currentStart + currentLength - 1].hour,
            avgScore: Math.round(avg),
            length: currentLength,
          };
        }
      }
      currentStart = -1;
      currentLength = 0;
      currentSum = 0;
    }
  }

  // Check final run
  if (currentLength >= 2) {
    const avg = currentSum / currentLength;
    if (avg > bestAvg) {
      bestWindow = {
        startHour: results[currentStart].hour,
        endHour: results[currentStart + currentLength - 1].hour,
        avgScore: Math.round(avg),
        length: currentLength,
      };
    }
  }

  return bestWindow;
}

// ─── Transport Mode Impact ───────────────────────────────────────────────────

export function computeTransportImpact(
  h: HourlyData,
  _surgeScore: number,
  surgeLevel: SurgeLevel
): TransportImpact[] {
  const impacts: TransportImpact[] = [];

  // 1. Grab/Car
  const grabMultiplier = getMultiplierLabel(surgeLevel);
  let grabTip = 'Normal pricing — book anytime';
  if (surgeLevel === 'MODERATE') grabTip = 'Slightly elevated — consider booking soon';
  if (surgeLevel === 'HIGH') grabTip = 'High surge — wait if possible';
  if (surgeLevel === 'EXTREME') grabTip = 'Extreme pricing — wait or use alternatives';

  impacts.push({
    mode: 'grab',
    label: 'Grab / Car',
    status: grabMultiplier,
    severity: surgeLevel === 'LOW' ? 'good' : surgeLevel === 'MODERATE' ? 'moderate' : surgeLevel === 'HIGH' ? 'poor' : 'severe',
    tip: grabTip,
    multiplier: grabMultiplier,
  });

  // 2. Angkas/Motorcycle
  let angkasStatus: string;
  let angkasSeverity: TransportImpact['severity'];
  let angkasTip: string;

  if (h.wind_speed > 40) {
    angkasStatus = 'Very Limited';
    angkasSeverity = 'severe';
    angkasTip = 'Unsafe wind conditions for motorcycles';
  } else if (h.precipitation > 5) {
    angkasStatus = 'Limited';
    angkasSeverity = 'poor';
    angkasTip = 'Heavy rain — fewer riders available';
  } else if (surgeLevel === 'EXTREME') {
    angkasStatus = '2.0–3.2x';
    angkasSeverity = 'poor';
    angkasTip = 'High demand, limited availability';
  } else if (surgeLevel === 'HIGH') {
    angkasStatus = '1.3–2.0x';
    angkasSeverity = 'moderate';
    angkasTip = 'Elevated pricing but available';
  } else {
    angkasStatus = 'Normal–1.2x';
    angkasSeverity = 'good';
    angkasTip = 'Good conditions for motorcycle rides';
  }

  impacts.push({
    mode: 'angkas',
    label: 'Angkas / Motorcycle',
    status: angkasStatus,
    severity: angkasSeverity,
    tip: angkasTip,
  });

  // 3. Jeepney/Bus
  let jeepStatus: string;
  let jeepSeverity: TransportImpact['severity'];
  let jeepTip: string;

  if (h.precipitation_probability > 70) {
    jeepStatus = 'Delayed / Rerouted';
    jeepSeverity = 'poor';
    jeepTip = 'Flood risk may cause route changes';
  } else if (h.precipitation_probability > 40) {
    jeepStatus = 'Expect Longer Waits';
    jeepSeverity = 'moderate';
    jeepTip = 'Some delays likely — leave earlier';
  } else {
    jeepStatus = 'Normal Schedule';
    jeepSeverity = 'good';
    jeepTip = 'Public transport running normally';
  }

  impacts.push({
    mode: 'jeepney',
    label: 'Jeepney / Bus',
    status: jeepStatus,
    severity: jeepSeverity,
    tip: jeepTip,
  });

  // 4. Walking/Bike
  let walkStatus: string;
  let walkSeverity: TransportImpact['severity'];
  let walkTip: string;

  if (h.precipitation > 2 || h.wind_speed > 30) {
    walkStatus = 'Not Recommended';
    walkSeverity = 'severe';
    walkTip = 'Rain or wind too strong for walking/biking';
  } else if (h.precipitation_probability > 50) {
    walkStatus = 'Risky';
    walkSeverity = 'moderate';
    walkTip = 'Bring rain gear if you must walk';
  } else {
    walkStatus = 'Good Conditions';
    walkSeverity = 'good';
    walkTip = 'Safe to walk or bike';
  }

  impacts.push({
    mode: 'walking',
    label: 'Walking / Bike',
    status: walkStatus,
    severity: walkSeverity,
    tip: walkTip,
  });

  return impacts;
}

// ─── Savings Estimate ────────────────────────────────────────────────────────

export function estimateSavings(currentLevel: SurgeLevel, futureLevel: SurgeLevel): number {
  const currentMult = SURGE_MULTIPLIERS[currentLevel];
  const futureMult = SURGE_MULTIPLIERS[futureLevel];

  if (currentMult <= futureMult) return 0;

  const savings = ((currentMult - futureMult) / currentMult) * 100;
  return Math.round(savings / 5) * 5; // Round to nearest 5%
}

// ─── Recommendations Generator ───────────────────────────────────────────────

export function generateRecommendations(
  results: SurgeResult[],
  currentHour: number,
  hourly: HourlyData[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  if (results.length === 0) return recommendations;

  // Find current index in results
  const currentIdx = results.findIndex((r) => r.hour === currentHour);
  if (currentIdx === -1) return recommendations;

  const currentResult = results[currentIdx];
  const futureResults = results.slice(currentIdx);

  // 1. Check for LOW→HIGH transition within 60 minutes
  for (let i = 1; i < Math.min(2, futureResults.length); i++) {
    if (currentResult.score < 50 && futureResults[i].score >= 50) {
      const savings = estimateSavings(
        classifySurgeLevel(futureResults[i].score),
        currentResult.level
      );
      recommendations.push({
        priority: 1,
        action: 'book_now',
        title: 'Book Now',
        description: `Surge starts in ~${i * 60} minutes. Save ~${savings}% by booking immediately.`,
        savings,
        confidence: 'high',
      });
      break;
    }
  }

  // 2. If currently HIGH/EXTREME, find when it drops
  if (currentResult.level === 'HIGH' || currentResult.level === 'EXTREME') {
    let dropIdx = -1;
    for (let i = 1; i < futureResults.length; i++) {
      if (futureResults[i].score < 50) {
        dropIdx = i;
        break;
      }
    }

    if (dropIdx > 0) {
      const waitMinutes = dropIdx * 60;
      const futureLevel = classifySurgeLevel(futureResults[dropIdx].score);
      const savings = estimateSavings(currentResult.level, futureLevel);
      const confidence: Recommendation['confidence'] = dropIdx <= 1 ? 'high' : dropIdx <= 3 ? 'moderate' : 'low';

      recommendations.push({
        priority: recommendations.length + 1,
        action: 'wait',
        title: 'Wait It Out',
        description: `Surge drops to ${futureLevel} in ~${waitMinutes} min. Estimated savings: ~${savings}%.`,
        savings,
        confidence,
      });
    }
  }

  // 3. Find dry window (2+ hours with precip prob < 20%)
  const futureHourly = hourly.slice(currentIdx);
  let dryStart = -1;
  let dryLength = 0;

  for (let i = 0; i < Math.min(6, futureHourly.length); i++) {
    if (futureHourly[i].precipitation_probability < 20) {
      if (dryStart === -1) dryStart = i;
      dryLength++;
    } else {
      if (dryLength >= 2) {
        const startHour = futureHourly[dryStart].hour;
        const endHour = futureHourly[dryStart + dryLength - 1].hour;
        recommendations.push({
          priority: recommendations.length + 1,
          action: 'switch_mode',
          title: 'Dry Window',
          description: `Clear skies ${formatHour(startHour)}–${formatHour(endHour)}: lower surge, motorcycle available.`,
          savings: 15,
          confidence: dryStart <= 1 ? 'high' : 'moderate',
        });
        break;
      }
      dryStart = -1;
      dryLength = 0;
    }
  }

  // Check final dry run
  if (dryLength >= 2 && recommendations.length < 3) {
    const startHour = futureHourly[dryStart].hour;
    const endHour = futureHourly[dryStart + dryLength - 1].hour;
    recommendations.push({
      priority: recommendations.length + 1,
      action: 'switch_mode',
      title: 'Dry Window',
      description: `Clear skies ${formatHour(startHour)}–${formatHour(endHour)}: lower surge, motorcycle available.`,
      savings: 15,
      confidence: dryStart <= 1 ? 'high' : 'moderate',
    });
  }

  // Cap at 3, re-number priorities
  return recommendations.slice(0, 3).map((r, i) => ({ ...r, priority: i + 1 }));
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export { formatHour };
