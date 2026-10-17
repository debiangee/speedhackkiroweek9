import { manilaHour } from '../utils/time';
import { useMemo, useState } from 'react';
import type { HourlyData, DailySummary } from '../hooks/useWeatherData';
import { useAirQuality, getAqiBonus } from '../hooks/useAirQuality';
import {
  computeDaySurge,
  findBestWindow,
  findPeakWindow,
  classifySurgeLevel,
  formatHour,
} from '../utils/surge-engine';
import type { TransportImpact, SurgeResult } from '../utils/surge-engine';
import { SurgeTimeline } from './SurgeTimeline';
import { TransportModeCards } from './TransportModeCards';
import { StarIcon, CloudRainIcon, CarIcon, BanknoteIcon, WavesIcon } from './Icons';
import './TransportSurgePredictor.css';

interface Props {
  region: string;
  hourly: HourlyData[];
  daily: DailySummary[];
  cityCoords: { lat: number; lon: number } | null;
}

export function TransportSurgePredictor({ hourly, cityCoords }: Props) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const currentHour = manilaHour();

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

  const activeHourIdx = selectedDayIdx === 0 ? surgeResults.findIndex(r => r.hour === currentHour) : 0;
  const activeResult = surgeResults[Math.max(0, activeHourIdx)];
  const activeHourly = selectedDayHourly[Math.max(0, activeHourIdx)];
  const transportImpacts: TransportImpact[] = activeHourly ? [
    { mode: 'grab', label: 'Car / taxi', status: 'Fares and availability unknown', severity: 'moderate' as const, tip: 'Check the operator directly. This app has no traffic, fare or driver feed.' },
    { mode: 'angkas', label: 'Motorcycle', status: 'Weather exposure', severity: 'moderate' as const, tip: `Forecast wind ${activeHourly.wind_speed} km/h, rain ${activeHourly.precipitation} mm. Road and riding conditions are unverified.` },
    { mode: 'jeepney', label: 'Jeepney / bus', status: 'Service status unknown', severity: 'moderate' as const, tip: 'Confirm schedules and disruptions with the operator or local authorities.' },
    { mode: 'walking', label: 'Walking / cycling', status: 'Weather exposure', severity: 'moderate' as const, tip: `Forecast rain probability ${activeHourly.precipitation_probability}%. Check local conditions before leaving.` },
  ] : [];

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

  function renderFactorIcon(factor: SurgeResult['topFactor']) {
    switch (factor) {
      case 'weather':
        return <CloudRainIcon size={14} color="currentColor" />;
      case 'rush_hour':
        return <CarIcon size={14} color="currentColor" />;
      case 'payday':
        return <BanknoteIcon size={14} color="currentColor" />;
      case 'sustained_rain':
        return <WavesIcon size={14} color="currentColor" />;
      default:
        return <CloudRainIcon size={14} color="currentColor" />;
    }
  }

  function formatFactorName(factor: SurgeResult['topFactor']) {
    switch (factor) {
      case 'weather':
        return 'Severe Weather & Rain';
      case 'rush_hour':
        return 'Peak Commute Rush Hour';
      case 'payday':
        return 'Payday Demand Spike';
      case 'sustained_rain':
        return 'Sustained Heavy Precipitation';
      default:
        return 'Weather Conditions';
    }
  }

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
            {i === bestDayIdx && (
              <span className="best-badge" title="Lowest modeled demand score this week">
                <StarIcon size={12} color="#f59e0b" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Hero Surge Multiplier Card — Non-Technical Friendly */}
      {activeResult && (
        <div className={`surge-hero-card surge-hero-${activeResult.level.toLowerCase()}`}>
          <div className="surge-hero-header">
            <div className="surge-hero-caption-group">
              <span className="surge-hero-title">
                {selectedDayIdx === 0 ? 'FORECAST DEMAND INDICATOR' : 'FORECAST DEMAND INDICATOR'}
              </span>
              <span className="surge-hero-time">({formatHour(activeResult.hour)})</span>
            </div>
            <span className={`surge-level-pill level-pill-${activeResult.level.toLowerCase()}`}>
              <span className="level-pulse-dot" aria-hidden="true" />
              {activeResult.level} modeled demand
            </span>
          </div>

          <div className="surge-hero-body">
            <div className="surge-multiplier-group">
              <div className="surge-number-box">
                <span className="surge-multiplier-number">
                  {activeResult.score}/100
                </span>
                <span className="surge-rate-badge">Heuristic score, not a price</span>
              </div>
              <div className="surge-multiplier-meta">
                <p className="surge-plain-explanation">
                  Weather and calendar inputs only; not calibrated against actual demand. No live fares, traffic or driver availability.
                </p>
              </div>
            </div>

            <div className="surge-top-factor">
              <span className="factor-label">Largest modeled input:</span>
              <span className="factor-pill">
                <span className="factor-icon" aria-hidden="true">{renderFactorIcon(activeResult.topFactor)}</span>
                <span className="factor-name">{formatFactorName(activeResult.topFactor)}</span>
              </span>
            </div>
          </div>
        </div>
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
        <div className="surge-modes-section">
          <h4 className="surge-subsection-title">Transport planning context</h4>
          <TransportModeCards impacts={transportImpacts} />
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
