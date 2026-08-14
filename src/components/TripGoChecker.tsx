import { useState, useEffect, useMemo } from 'react';
import { useWeatherData } from '../hooks/useWeatherData';
import { REGIONS } from '../utils/regions';
import { getCitiesForRegion, getCityCoords } from '../utils/cities';
import { computeVerdict, findTravelWindows, getTripAdvice } from '../utils/trip-verdict';
import type { VerdictResult, TripAdviceItem } from '../utils/trip-verdict';
import type { HourlyData, DailySummary } from '../hooks/useWeatherData';
import { MapPinIcon, CheckCircleIcon, AlertCircleIcon, CloudRainIcon, WindIcon, DropletIcon, SunIcon } from './Icons';
import './TripGoChecker.css';

interface Props {
  hourly: HourlyData[];
  daily: DailySummary[];
  region: string;
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function getDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short' });
}

function getDayDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function TripGoChecker({ hourly, daily, region }: Props) {
  // Destination state (independent from dashboard region)
  const [destRegion, setDestRegion] = useState<string>(() => {
    return sessionStorage.getItem('trip-dest-region') || '';
  });
  const [destCity, setDestCity] = useState<string | null>(() => {
    return sessionStorage.getItem('trip-dest-city') || null;
  });
  const [selectedDay, setSelectedDay] = useState(0);

  // Reset destination when dashboard region changes
  useEffect(() => {
    setDestRegion('');
    setDestCity(null);
    sessionStorage.removeItem('trip-dest-region');
    sessionStorage.removeItem('trip-dest-city');
  }, [region]);

  // Persist selections
  useEffect(() => {
    if (destRegion) sessionStorage.setItem('trip-dest-region', destRegion);
    else sessionStorage.removeItem('trip-dest-region');
  }, [destRegion]);

  useEffect(() => {
    if (destCity) sessionStorage.setItem('trip-dest-city', destCity);
    else sessionStorage.removeItem('trip-dest-city');
  }, [destCity]);

  // Fetch weather for destination (or use parent data if no destination selected)
  const cityCoords = useMemo(() => {
    return destCity && destRegion ? getCityCoords(destRegion, destCity) : null;
  }, [destCity, destRegion]);
  const useDestData = destRegion !== '' && destRegion !== region;

  const {
    hourly: destHourly,
    daily: destDaily,
    loading: destLoading,
    error: destError,
    refetch: destRefetch,
  } = useWeatherData(useDestData ? destRegion : region, useDestData ? cityCoords : undefined);

  // Determine which data to use
  const activeHourly = useDestData ? destHourly : hourly;
  const activeDaily = useDestData ? destDaily : daily;
  const isLoading = useDestData && destLoading;
  const error = useDestData ? destError : null;

  // Cities for selected destination region
  const cities = destRegion ? getCitiesForRegion(destRegion) : [];

  // Get hourly data for selected day
  const dayHourly = useMemo(() => {
    if (activeDaily.length === 0) return activeHourly.slice(0, 24);
    const dayDate = activeDaily[selectedDay]?.date;
    if (!dayDate) return [];
    return activeHourly.filter((h) => h.date === dayDate);
  }, [activeHourly, activeDaily, selectedDay]);

  // Compute verdict
  const verdict: VerdictResult | null = useMemo(() => computeVerdict(dayHourly), [dayHourly]);

  // Travel windows
  const windows = useMemo(() => findTravelWindows(dayHourly), [dayHourly]);

  // Advice
  const advice: TripAdviceItem[] = useMemo(() => {
    if (!verdict) return [];
    return getTripAdvice(verdict.verdict, dayHourly);
  }, [verdict, dayHourly]);

  // Day verdict colors for the day selector
  const dayVerdicts = useMemo(() => {
    return activeDaily.map((d) => {
      if (d.avg_prob < 30) return 'go';
      if (d.avg_prob < 60) return 'caution';
      return 'nogo';
    });
  }, [activeDaily]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDestRegion(e.target.value);
    setDestCity(null);
    setSelectedDay(0);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDestCity(e.target.value || null);
  };

  return (
    <div className="trip-go-checker">
      {/* Destination selector */}
      <div className="tgc-destination">
        <div className="tgc-select-group">
          <label className="tgc-label" htmlFor="tgc-region">Where are you going?</label>
          <select
            id="tgc-region"
            className="tgc-select"
            value={destRegion}
            onChange={handleRegionChange}
          >
            <option value="">Select a region...</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {destRegion && cities.length > 0 && (
          <div className="tgc-select-group">
            <label className="tgc-label" htmlFor="tgc-city">City (optional)</label>
            <select
              id="tgc-city"
              className="tgc-select"
              value={destCity || ''}
              onChange={handleCityChange}
            >
              <option value="">Region center</option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="tgc-skeleton">
          <div className="tgc-skeleton-banner" />
          <div className="tgc-skeleton-cards" />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="tgc-error">
          <p>Could not fetch weather for destination</p>
          <span className="tgc-error-detail">{error}</span>
          <button className="tgc-retry-btn" onClick={destRefetch}>Try Again</button>
        </div>
      )}

      {/* No region selected prompt */}
      {!destRegion && !isLoading && !error && (
        <div className="tgc-empty">
          <MapPinIcon size={32} color="var(--text-muted)" />
          <p>Select a destination to check if it's worth going</p>
        </div>
      )}

      {/* Verdict display */}
      {destRegion && !isLoading && !error && verdict && (
        <>
          {/* Day selector */}
          <div className="tgc-days" role="tablist" aria-label="Forecast days">
            {activeDaily.map((d, i) => (
              <button
                key={d.date}
                className={`tgc-day ${i === selectedDay ? 'active' : ''} tgc-day-${dayVerdicts[i]}`}
                onClick={() => setSelectedDay(i)}
                role="tab"
                aria-selected={i === selectedDay}
              >
                <span className="tgc-day-label">{getDayLabel(d.date, i)}</span>
                <span className="tgc-day-date">{getDayDate(d.date)}</span>
                <span className={`tgc-day-dot ${dayVerdicts[i]}`} />
              </button>
            ))}
          </div>

          {/* Verdict banner */}
          <div className={`tgc-verdict tgc-verdict-${verdict.verdict.toLowerCase().replace('-', '')}`}>
            <div className="tgc-verdict-icon">
              {verdict.verdict === 'GO' && <CheckCircleIcon size={28} color="white" />}
              {verdict.verdict === 'CAUTION' && <AlertCircleIcon size={28} color="white" />}
              {verdict.verdict === 'NO-GO' && <CloudRainIcon size={28} color="white" />}
            </div>
            <div className="tgc-verdict-text">
              <h3 className="tgc-verdict-label">{verdict.verdict === 'GO' ? 'Good to Go!' : verdict.verdict === 'CAUTION' ? 'Proceed with Caution' : 'Not Worth It'}</h3>
              <p className="tgc-verdict-summary">{verdict.summary}</p>
            </div>
            <div className="tgc-verdict-score">
              <span className="tgc-score-value">{verdict.score}</span>
              <span className="tgc-score-label">/ 100</span>
            </div>
            {verdict.verdict !== 'GO' && (
              <span className="tgc-factor-badge">{verdict.primaryFactor}</span>
            )}
          </div>

          {/* Condition cards */}
          <div className="tgc-conditions">
            <div className={`tgc-card ${verdict.subScores.rain_prob >= 70 ? 'good' : verdict.subScores.rain_prob >= 40 ? 'moderate' : 'poor'}`}>
              <CloudRainIcon size={18} color="currentColor" />
              <span className="tgc-card-value">{Math.round(verdict.metrics.avgRainProb)}%</span>
              <span className="tgc-card-label">Rain Chance</span>
            </div>
            <div className={`tgc-card ${verdict.subScores.precipitation >= 70 ? 'good' : verdict.subScores.precipitation >= 40 ? 'moderate' : 'poor'}`}>
              <DropletIcon size={18} color="currentColor" />
              <span className="tgc-card-value">{verdict.metrics.totalRain.toFixed(1)}mm</span>
              <span className="tgc-card-label">Rainfall</span>
            </div>
            <div className={`tgc-card ${verdict.subScores.wind >= 70 ? 'good' : verdict.subScores.wind >= 40 ? 'moderate' : 'poor'}`}>
              <WindIcon size={18} color="currentColor" />
              <span className="tgc-card-value">{Math.round(verdict.metrics.avgWind)} km/h</span>
              <span className="tgc-card-label">Wind</span>
            </div>
            <div className={`tgc-card ${verdict.subScores.visibility >= 70 ? 'good' : verdict.subScores.visibility >= 40 ? 'moderate' : 'poor'}`}>
              <SunIcon size={18} color="currentColor" />
              <span className="tgc-card-value">{(verdict.metrics.avgVisibility / 1000).toFixed(1)} km</span>
              <span className="tgc-card-label">Visibility</span>
            </div>
          </div>

          {/* Travel windows */}
          {windows.best && windows.worst && (
            <div className="tgc-windows">
              {windows.allBad ? (
                <div className="tgc-postpone">
                  <AlertCircleIcon size={20} color="#c62828" />
                  <p>All time windows score poorly — consider postponing your trip.</p>
                </div>
              ) : (
                <>
                  <div className="tgc-window tgc-window-best">
                    <SunIcon size={16} color="#2e7d32" />
                    <div>
                      <strong>Best: {formatHour(windows.best.startHour)} – {formatHour(windows.best.endHour + 1)}</strong>
                      <span className="tgc-window-score">Score: {windows.best.score}/100</span>
                    </div>
                  </div>
                  <div className="tgc-window tgc-window-worst">
                    <CloudRainIcon size={16} color="#c62828" />
                    <div>
                      <strong>Avoid: {formatHour(windows.worst.startHour)} – {formatHour(windows.worst.endHour + 1)}</strong>
                      <span className="tgc-window-score">Score: {windows.worst.score}/100</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Practical advice */}
          {advice.length > 0 && (
            <ul className="tgc-advice">
              {advice.map((item, i) => (
                <li key={i} className={`tgc-advice-item tgc-advice-${item.type}`}>
                  {item.text}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
