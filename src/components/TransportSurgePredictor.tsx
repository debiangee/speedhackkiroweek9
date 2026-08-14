import { useMemo, useState } from 'react';
import type { HourlyData, DailySummary } from '../hooks/useWeatherData';
import { useAirQuality, getAqiBonus } from '../hooks/useAirQuality';
import {
  computeDaySurge,
  findBestWindow,
  findPeakWindow,
  computeTransportImpact,
  generateRecommendations,
  classifySurgeLevel,
} from '../utils/surge-engine';
import type { SurgeResult } from '../utils/surge-engine';
import { SurgeAlert } from './SurgeAlert';
import { SurgeTimeline } from './SurgeTimeline';
import { TransportModeCards } from './TransportModeCards';
import { SurgeRecommendations } from './SurgeRecommendations';
import './TransportSurgePredictor.css';

interface Props {
  region: string;
  hourly: HourlyData[];
  daily: DailySummary[];
  cityCoords: { lat: number; lon: number } | null;
}

export function TransportSurgePredictor({ hourly, cityCoords }: Props) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const currentHour = new Date().getHours();

  // Fetch air quality (optional enhancement)
  const { data: aqData } = useAirQuality(cityCoords);

  // Group hourly data by day
  const dailyHourly = useMemo(() => {
    const groups: HourlyData[][] = [];
    const dateMap = new Map<string, HourlyData[]>();

    for (const h of hourly) {
      if (!dateMap.has(h.date)) dateMap.set(h.date, []);
      dateMap.get(h.date)!.push(h);
    }

    for (const entries of dateMap.values()) {
      groups.push(entries);
    }

    return groups;
  }, [hourly]);

  // Compute AQI bonuses for today
  const aqiBonuses = useMemo(() => {
    return aqData.map((aq) => getAqiBonus(aq.aqi));
  }, [aqData]);

  // Compute surge results for selected day
  const selectedDayHourly = dailyHourly[selectedDayIdx] ?? [];
  const selectedDate = selectedDayHourly[0] ? new Date(selectedDayHourly[0].date + 'T00:00:00') : new Date();

  const surgeResults = useMemo((): SurgeResult[] => {
    if (selectedDayHourly.length === 0) return [];
    const bonuses = selectedDayIdx === 0 ? aqiBonuses : [];
    return computeDaySurge(selectedDayHourly, selectedDate, bonuses);
  }, [selectedDayHourly, selectedDate, selectedDayIdx, aqiBonuses]);

  // Window detection
  const bestWindow = useMemo(() => findBestWindow(surgeResults), [surgeResults]);
  const peakWindow = useMemo(() => findPeakWindow(surgeResults), [surgeResults]);

  // Transport impact for current/first visible hour
  const activeHourIdx = selectedDayIdx === 0
    ? surgeResults.findIndex((r) => r.hour === currentHour)
    : 0;
  const activeResult = surgeResults[Math.max(0, activeHourIdx)];
  const activeHourly = selectedDayHourly[Math.max(0, activeHourIdx)];

  const transportImpacts = useMemo(() => {
    if (!activeResult || !activeHourly) return [];
    return computeTransportImpact(activeHourly, activeResult.score, activeResult.level);
  }, [activeResult, activeHourly]);

  // Recommendations (only for today)
  const recommendations = useMemo(() => {
    if (selectedDayIdx !== 0 || selectedDayHourly.length === 0) return [];
    return generateRecommendations(surgeResults, currentHour, selectedDayHourly);
  }, [surgeResults, currentHour, selectedDayHourly, selectedDayIdx]);

  // Multi-day overview: peak score per day
  const dayOverview = useMemo(() => {
    return dailyHourly.map((dayHours, i) => {
      const date = new Date((dayHours[0]?.date ?? new Date().toISOString().split('T')[0]) + 'T00:00:00');
      const bonuses = i === 0 ? aqiBonuses : [];
      const results = computeDaySurge(dayHours, date, bonuses);
      const peakScore = results.length > 0 ? Math.max(...results.map((r) => r.score)) : 0;
      const peakHour = results.reduce((best, r) => r.score > best.score ? r : best, results[0]);
      return {
        date: dayHours[0]?.date ?? '',
        dayLabel: getDayLabel(date, i),
        peakScore,
        peakHour: peakHour?.hour ?? 12,
        level: classifySurgeLevel(peakScore),
      };
    });
  }, [dailyHourly, aqiBonuses]);

  // Best day to travel
  const bestDayIdx = dayOverview.length > 0
    ? dayOverview.reduce((best, day, i) => day.peakScore < dayOverview[best].peakScore ? i : best, 0)
    : 0;

  if (hourly.length === 0) return null;

  return (
    <div className="surge-predictor">
      {/* 7-Day Overview Strip */}
      <div className="surge-day-strip" role="tablist" aria-label="Select forecast day">
        {dayOverview.map((day, i) => (
          <button
            key={day.date}
            className={`day-chip ${i === selectedDayIdx ? 'active' : ''} ${i === bestDayIdx ? 'best-day' : ''}`}
            onClick={() => setSelectedDayIdx(i)}
            role="tab"
            aria-selected={i === selectedDayIdx}
          >
            <span className={`day-dot level-dot-${day.level.toLowerCase()}`} />
            <span className="day-chip-label">{day.dayLabel}</span>
            {i === bestDayIdx && <span className="best-badge">⭐</span>}
          </button>
        ))}
      </div>

      {/* Pre-Surge Alert (today only) */}
      {selectedDayIdx === 0 && (
        <SurgeAlert results={surgeResults} currentHour={currentHour} />
      )}

      {/* Hourly Surge Timeline */}
      <SurgeTimeline
        results={surgeResults}
        bestWindow={bestWindow}
        peakWindow={peakWindow}
        currentHour={selectedDayIdx === 0 ? currentHour : -1}
      />

      {/* Transport Mode Breakdown */}
      {transportImpacts.length > 0 && (
        <TransportModeCards impacts={transportImpacts} />
      )}

      {/* Smart Booking Recommendations (today only) */}
      {recommendations.length > 0 && (
        <div className="surge-recs-section">
          <h4 className="surge-subsection-title">💡 Smart Booking Tips</h4>
          <SurgeRecommendations recommendations={recommendations} />
        </div>
      )}
    </div>
  );
}

// Helpers

function getDayLabel(date: Date, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tom.';
  return date.toLocaleDateString('en-PH', { weekday: 'short' });
}

export default TransportSurgePredictor;
