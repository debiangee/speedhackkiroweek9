/**
 * Optimization Engine for Travel Decision Making
 * 
 * Implements an iterative "agentic loop" pattern:
 * 1. OBSERVE — collect current weather signals
 * 2. REASON — score each time window against user goals
 * 3. RECOMMEND — surface the best action with transparent reasoning
 * 4. RE-EVALUATE — loop when data updates to refine recommendations
 * 
 * The engine shows its "thinking" to the user so they understand WHY
 * a recommendation was made, not just WHAT it is.
 */

import type { HourlyData, DailySummary } from '../hooks/useWeatherData';

// --- Types ---

export type GoalType = 'commute' | 'outdoor-activity' | 'travel' | 'stay-dry';

export interface OptimizationGoal {
  type: GoalType;
  label: string;
  description: string;
  icon: string;
}

export interface ReasoningStep {
  signal: string;
  value: string;
  impact: 'positive' | 'neutral' | 'negative';
  explanation: string;
}

export interface TimeWindow {
  startHour: number;
  endHour: number;
  score: number;
  label: string;
}

export interface OptimizationResult {
  goal: GoalType;
  verdict: string;
  confidence: number; // 0-100
  bestWindow: TimeWindow | null;
  avoidWindows: TimeWindow[];
  reasoning: ReasoningStep[];
  suggestions: string[];
  iterationCount: number;
  lastUpdated: string;
}

// --- Constants ---

export const GOALS: OptimizationGoal[] = [
  { type: 'commute', label: 'Commute', description: 'Best time to leave for work/school', icon: '🚗' },
  { type: 'outdoor-activity', label: 'Outdoor Activity', description: 'Running, sports, or events', icon: '🏃' },
  { type: 'travel', label: 'Travel', description: 'Day trip or inter-city travel', icon: '✈️' },
  { type: 'stay-dry', label: 'Stay Dry', description: 'Minimal rain exposure', icon: '☂️' },
];

// --- Scoring Weights by Goal ---

interface Weights {
  rain_prob: number;
  rain_amount: number;
  wind: number;
  temperature: number;
  humidity: number;
}

const GOAL_WEIGHTS: Record<GoalType, Weights> = {
  'commute': { rain_prob: 0.4, rain_amount: 0.2, wind: 0.2, temperature: 0.1, humidity: 0.1 },
  'outdoor-activity': { rain_prob: 0.3, rain_amount: 0.2, wind: 0.15, temperature: 0.2, humidity: 0.15 },
  'travel': { rain_prob: 0.35, rain_amount: 0.25, wind: 0.2, temperature: 0.1, humidity: 0.1 },
  'stay-dry': { rain_prob: 0.5, rain_amount: 0.3, wind: 0.1, temperature: 0.05, humidity: 0.05 },
};

// --- Scoring Functions ---

function scoreRainProb(prob: number): number {
  // 0% = 100 score, 100% = 0 score (inverse linear)
  return Math.max(0, 100 - prob);
}

function scoreRainAmount(mm: number): number {
  if (mm === 0) return 100;
  if (mm < 1) return 85;
  if (mm < 5) return 60;
  if (mm < 15) return 30;
  return 5;
}

function scoreWind(kmh: number, gusts?: number): number {
  // Use gusts if available — they're more relevant for safety
  const effective = gusts && gusts > kmh ? (kmh * 0.6 + gusts * 0.4) : kmh;
  if (effective < 15) return 100;
  if (effective < 30) return 75;
  if (effective < 50) return 40;
  return 10;
}

function scoreTemperature(tempC: number, goal: GoalType): number {
  // For outdoor activity, ideal is 24-30°C
  if (goal === 'outdoor-activity') {
    if (tempC >= 24 && tempC <= 30) return 100;
    if (tempC >= 20 && tempC <= 34) return 70;
    return 40;
  }
  // For commute/travel, comfortable range is wider
  if (tempC >= 22 && tempC <= 34) return 90;
  if (tempC >= 18 && tempC <= 38) return 60;
  return 30;
}

function scoreHumidity(pct: number): number {
  if (pct < 60) return 100;
  if (pct < 75) return 80;
  if (pct < 85) return 55;
  return 30;
}

// --- Core Engine ---

function scoreHour(h: HourlyData, goal: GoalType): number {
  const w = GOAL_WEIGHTS[goal];
  const s =
    w.rain_prob * scoreRainProb(h.precipitation_probability) +
    w.rain_amount * scoreRainAmount(h.precipitation) +
    w.wind * scoreWind(h.wind_speed, h.wind_gusts) +
    w.temperature * scoreTemperature(h.temperature, goal) +
    w.humidity * scoreHumidity(h.humidity);
  return Math.round(s);
}

function findBestWindow(hourly: HourlyData[], goal: GoalType, windowSize: number): TimeWindow | null {
  if (hourly.length < windowSize) return null;

  let bestStart = 0;
  let bestScore = -1;

  for (let i = 0; i <= hourly.length - windowSize; i++) {
    const windowScore = hourly.slice(i, i + windowSize)
      .reduce((sum, h) => sum + scoreHour(h, goal), 0) / windowSize;
    if (windowScore > bestScore) {
      bestScore = windowScore;
      bestStart = i;
    }
  }

  return {
    startHour: hourly[bestStart].hour,
    endHour: hourly[Math.min(bestStart + windowSize - 1, hourly.length - 1)].hour,
    score: Math.round(bestScore),
    label: formatTimeWindow(hourly[bestStart].hour, hourly[Math.min(bestStart + windowSize - 1, hourly.length - 1)].hour),
  };
}

function findAvoidWindows(hourly: HourlyData[], goal: GoalType, windowSize: number): TimeWindow[] {
  if (hourly.length < windowSize) return [];

  const windows: { start: number; score: number }[] = [];
  for (let i = 0; i <= hourly.length - windowSize; i++) {
    const windowScore = hourly.slice(i, i + windowSize)
      .reduce((sum, h) => sum + scoreHour(h, goal), 0) / windowSize;
    windows.push({ start: i, score: windowScore });
  }

  // Return windows scoring below 40 (bad)
  return windows
    .filter((w) => w.score < 40)
    .slice(0, 3)
    .map((w) => ({
      startHour: hourly[w.start].hour,
      endHour: hourly[Math.min(w.start + windowSize - 1, hourly.length - 1)].hour,
      score: Math.round(w.score),
      label: formatTimeWindow(hourly[w.start].hour, hourly[Math.min(w.start + windowSize - 1, hourly.length - 1)].hour),
    }));
}

function buildReasoning(hourly: HourlyData[], goal: GoalType): ReasoningStep[] {
  const steps: ReasoningStep[] = [];
  const avgProb = hourly.reduce((s, h) => s + h.precipitation_probability, 0) / hourly.length;
  const totalRain = hourly.reduce((s, h) => s + h.precipitation, 0);
  const maxWind = Math.max(...hourly.map((h) => h.wind_speed));
  const avgTemp = hourly.reduce((s, h) => s + h.temperature, 0) / hourly.length;
  const avgHumidity = hourly.reduce((s, h) => s + h.humidity, 0) / hourly.length;

  // Rain probability reasoning
  steps.push({
    signal: 'Rain Probability',
    value: `${Math.round(avgProb)}% avg`,
    impact: avgProb < 30 ? 'positive' : avgProb < 60 ? 'neutral' : 'negative',
    explanation: avgProb < 30
      ? 'Low rain chance — favorable for going out'
      : avgProb < 60
        ? 'Moderate rain chance — plan around dry windows'
        : 'High rain probability — outdoor plans at risk',
  });

  // Total rainfall
  steps.push({
    signal: 'Expected Rainfall',
    value: `${Math.round(totalRain * 10) / 10} mm`,
    impact: totalRain < 5 ? 'positive' : totalRain < 20 ? 'neutral' : 'negative',
    explanation: totalRain < 5
      ? 'Minimal rainfall expected'
      : totalRain < 20
        ? 'Moderate rain — umbrella recommended'
        : 'Heavy rain — significant outdoor disruption likely',
  });

  // Wind
  const maxGusts = Math.max(...hourly.map((h) => h.wind_gusts || 0));
  const windLabel = maxGusts > maxWind
    ? `up to ${Math.round(maxWind)} km/h (gusts ${Math.round(maxGusts)})`
    : `up to ${Math.round(maxWind)} km/h`;
  const effectiveWind = maxGusts > maxWind ? maxWind * 0.6 + maxGusts * 0.4 : maxWind;
  steps.push({
    signal: 'Wind Speed',
    value: windLabel,
    impact: effectiveWind < 30 ? 'positive' : effectiveWind < 50 ? 'neutral' : 'negative',
    explanation: effectiveWind < 30
      ? 'Calm winds — no concern'
      : effectiveWind < 50
        ? 'Moderate winds — may affect outdoor comfort'
        : 'Strong winds — travel and outdoor plans affected',
  });

  // Temperature (goal-specific)
  if (goal === 'outdoor-activity') {
    steps.push({
      signal: 'Temperature',
      value: `${Math.round(avgTemp)}°C avg`,
      impact: avgTemp >= 24 && avgTemp <= 30 ? 'positive' : avgTemp >= 20 && avgTemp <= 34 ? 'neutral' : 'negative',
      explanation: avgTemp >= 24 && avgTemp <= 30
        ? 'Ideal temperature range for physical activity'
        : avgTemp > 34
          ? 'Too hot — risk of heat exhaustion'
          : 'Temperature outside ideal range for exercise',
    });
  }

  // Humidity
  if (avgHumidity > 75) {
    steps.push({
      signal: 'Humidity',
      value: `${Math.round(avgHumidity)}%`,
      impact: 'negative',
      explanation: 'High humidity makes it feel hotter and less comfortable',
    });
  }

  return steps;
}

function buildSuggestions(result: Partial<OptimizationResult>, hourly: HourlyData[], goal: GoalType): string[] {
  const suggestions: string[] = [];
  const avgProb = hourly.reduce((s, h) => s + h.precipitation_probability, 0) / hourly.length;
  const totalRain = hourly.reduce((s, h) => s + h.precipitation, 0);

  if (result.bestWindow && result.bestWindow.score > 70) {
    suggestions.push(`Your best window is ${result.bestWindow.label} (score: ${result.bestWindow.score}/100)`);
  }

  if (goal === 'commute' && avgProb > 50) {
    suggestions.push('Leave earlier to avoid peak rain hours');
    suggestions.push('Have alternate transport ready (grab/taxi)');
  }

  if (goal === 'outdoor-activity' && totalRain > 10) {
    suggestions.push('Consider moving activity indoors today');
  }

  if (goal === 'travel' && avgProb > 60) {
    suggestions.push('Check if your route has flood-prone sections');
    suggestions.push('Pack extra time for slower traffic in rain');
  }

  if (goal === 'stay-dry' && result.avoidWindows && result.avoidWindows.length > 0) {
    suggestions.push(`Avoid going out during: ${result.avoidWindows.map((w) => w.label).join(', ')}`);
  }

  if (suggestions.length === 0) {
    suggestions.push('Conditions look good — proceed with your plans!');
  }

  return suggestions;
}

function getVerdict(confidence: number, goal: GoalType): string {
  if (confidence >= 80) {
    switch (goal) {
      case 'commute': return 'Great conditions for your commute';
      case 'outdoor-activity': return 'Perfect day for outdoor activities';
      case 'travel': return 'Good conditions for travel';
      case 'stay-dry': return 'You can stay dry easily today';
    }
  }
  if (confidence >= 50) {
    switch (goal) {
      case 'commute': return 'Commute is doable with preparation';
      case 'outdoor-activity': return 'Outdoor activity possible with timing';
      case 'travel': return 'Travel okay — plan around rain windows';
      case 'stay-dry': return 'Staying dry requires careful timing';
    }
  }
  switch (goal) {
    case 'commute': return 'Tough commute — prepare for delays';
    case 'outdoor-activity': return 'Not ideal for outdoor activities';
    case 'travel': return 'Consider postponing travel';
    case 'stay-dry': return 'High chance of getting wet today';
  }
}

function formatTimeWindow(start: number, end: number): string {
  const fmt = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };
  return `${fmt(start)} – ${fmt(end + 1 > 23 ? 23 : end + 1)}`;
}

// --- Public API ---

let iterationCount = 0;

/**
 * Run one iteration of the optimization loop.
 * Call this whenever weather data updates to get refined recommendations.
 */
export function runOptimization(
  hourly: HourlyData[],
  goal: GoalType,
): OptimizationResult {
  iterationCount++;

  if (hourly.length === 0) {
    return {
      goal,
      verdict: 'Waiting for weather data...',
      confidence: 0,
      bestWindow: null,
      avoidWindows: [],
      reasoning: [],
      suggestions: ['Data not yet available'],
      iterationCount,
      lastUpdated: new Date().toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' }),
    };
  }

  const windowSize = goal === 'commute' ? 2 : 3;
  const bestWindow = findBestWindow(hourly, goal, windowSize);
  const avoidWindows = findAvoidWindows(hourly, goal, windowSize);
  const reasoning = buildReasoning(hourly, goal);

  // Confidence = average score of all hours
  const allScores = hourly.map((h) => scoreHour(h, goal));
  const confidence = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

  const partialResult: Partial<OptimizationResult> = { bestWindow, avoidWindows };
  const suggestions = buildSuggestions(partialResult, hourly, goal);
  const verdict = getVerdict(confidence, goal);

  return {
    goal,
    verdict,
    confidence,
    bestWindow,
    avoidWindows,
    reasoning,
    suggestions,
    iterationCount,
    lastUpdated: new Date().toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' }),
  };
}

/**
 * Score a full week to find the best day for a goal.
 */
export function optimizeWeek(
  daily: DailySummary[],
  goal: GoalType,
): { bestDay: string; worstDay: string; dayScores: { date: string; score: number }[] } {
  const w = GOAL_WEIGHTS[goal];
  const dayScores = daily.map((d) => {
    const score =
      w.rain_prob * scoreRainProb(d.avg_prob) +
      w.rain_amount * scoreRainAmount(d.total_rain) +
      w.temperature * scoreTemperature(d.avg_temp, goal);
    return { date: d.date, score: Math.round(score) };
  });

  dayScores.sort((a, b) => b.score - a.score);
  return {
    bestDay: dayScores[0]?.date || '',
    worstDay: dayScores[dayScores.length - 1]?.date || '',
    dayScores,
  };
}
