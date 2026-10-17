import { forecastEpoch } from '../utils/time';
import { useState, useEffect } from 'react';
import { type DailySummary } from '../hooks/useWeatherData';
import './HistoricalComparison.css';

interface HistoricalComparisonProps {
  daily: DailySummary[];
  region: string;
  coords: { lat: number; lon: number };
}

interface HistoricalDay {
  date: string;
  total_rain: number;
  avg_temp: number;
}

export function HistoricalComparison({ daily, coords }: HistoricalComparisonProps) {
  const [lastYearData, setLastYearData] = useState<HistoricalDay[]>([]);
  const [loading, setLoading] = useState(true);

  const firstDate = daily[0]?.date;
  const dayCount = daily.length;
  const key = `${coords.lat},${coords.lon}:${firstDate}:${dayCount}`;
  const [resolvedKey, setResolvedKey] = useState('');
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function fetchHistorical() {
      setLoading(true);
      try {
        if (!firstDate || !dayCount) throw new Error('No forecast period');
        const lastYear = new Date(firstDate + 'T00:00:00Z');
        lastYear.setUTCFullYear(lastYear.getUTCFullYear() - 1);
        const startDate = lastYear.toISOString().split('T')[0];
        const endDate = new Date(lastYear.getTime() + (dayCount - 1) * 86400000).toISOString().split('T')[0];

        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum,temperature_2m_mean&timezone=Asia/Manila`;

        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('Historical API error');
        const data = await res.json();

        if (!Array.isArray(data.daily?.time) || data.daily.time.length !== dayCount || ['precipitation_sum', 'temperature_2m_mean'].some(k => !Array.isArray(data.daily[k]) || data.daily[k].length !== dayCount || data.daily[k].some((v: unknown) => typeof v !== 'number' || !Number.isFinite(v)))) throw new Error('Incomplete archive data');
        if (!cancelled && data.daily) {
          const days: HistoricalDay[] = data.daily.time.map((date: string, i: number) => ({
            date,
            total_rain: data.daily.precipitation_sum[i],
            avg_temp: data.daily.temperature_2m_mean[i],
          }));
          setLastYearData(days);
        }
      } catch {
        if (!cancelled) setLastYearData([]);
      } finally {
        if (!cancelled) { setLoading(false); setResolvedKey(key); }
        clearTimeout(timeout);
      }
    }

    fetchHistorical();
    return () => { cancelled = true; controller.abort(); clearTimeout(timeout); };
  }, [coords.lat, coords.lon, firstDate, dayCount, key]);

  if (loading || resolvedKey !== key) {
    return <div className="historical-loading">Loading historical data...</div>;
  }

  if (lastYearData.length === 0) {
    return <div className="historical-empty">No historical data available</div>;
  }

  const currentTotalRain = daily.reduce((s, d) => s + d.total_rain, 0);
  const lastYearTotalRain = lastYearData.reduce((s, d) => s + d.total_rain, 0);
  const currentAvgTemp = daily.reduce((s, d) => s + d.avg_temp, 0) / daily.length;
  const lastYearAvgTemp = lastYearData.reduce((s, d) => s + d.avg_temp, 0) / lastYearData.length;

  const periodLabel = `${new Date(forecastEpoch(firstDate + 'T00:00')).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })} · ${dayCount} days`;
  const rainDiff = currentTotalRain - lastYearTotalRain;
  const tempDiff = currentAvgTemp - lastYearAvgTemp;

  const rainPercent = lastYearTotalRain > 0
    ? Math.round((rainDiff / lastYearTotalRain) * 100)
    : 0;

  return (
    <div className="historical-comparison">
      <p>Open-Meteo Archive: previous-year calendar period vs forecast {periodLabel}, at the same coordinates. This is a year-to-year comparison, not a climate baseline.</p>
      <div className="historical-cards">
        <div className="historical-card">
          <span className="hist-label">Rain this week</span>
          <span className="hist-value">{currentTotalRain.toFixed(1)}mm</span>
          <span className={`hist-diff ${rainDiff > 0 ? 'wetter' : 'drier'}`}>
            {rainDiff > 0 ? '↑' : '↓'} {Math.abs(rainPercent)}% {rainDiff > 0 ? 'wetter' : 'drier'}
          </span>
        </div>
        <div className="historical-card">
          <span className="hist-label">Last year same week</span>
          <span className="hist-value">{lastYearTotalRain.toFixed(1)}mm</span>
          <span className="hist-sub">Avg temp: {lastYearAvgTemp.toFixed(1)}°C</span>
        </div>
        <div className="historical-card">
          <span className="hist-label">Temperature</span>
          <span className="hist-value">{currentAvgTemp.toFixed(1)}°C</span>
          <span className={`hist-diff ${tempDiff > 0 ? 'wetter' : 'drier'}`}>
            {tempDiff > 0 ? '↑' : '↓'} {Math.abs(tempDiff).toFixed(1)}° vs last year
          </span>
        </div>
      </div>

      <div className="historical-bar-compare">
        <div className="bar-row">
          <span className="bar-label">This year</span>
          <div className="bar-track">
            <div
              className="bar-fill bar-current"
              style={{ width: `${Math.min((currentTotalRain / Math.max(1, currentTotalRain, lastYearTotalRain)) * 100, 100)}%` }}
            />
          </div>
          <span className="bar-val">{currentTotalRain.toFixed(1)}mm</span>
        </div>
        <div className="bar-row">
          <span className="bar-label">Last year</span>
          <div className="bar-track">
            <div
              className="bar-fill bar-lastyear"
              style={{ width: `${Math.min((lastYearTotalRain / Math.max(1, currentTotalRain, lastYearTotalRain)) * 100, 100)}%` }}
            />
          </div>
          <span className="bar-val">{lastYearTotalRain.toFixed(1)}mm</span>
        </div>
      </div>
    </div>
  );
}
