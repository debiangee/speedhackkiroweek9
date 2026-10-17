import { type DailySummary } from '../hooks/useWeatherData';
import { DropletIcon, ThermometerIcon, SunIcon } from './Icons';
import './WeekSummaryCard.css';

interface WeekSummaryCardProps {
  daily: DailySummary[];
  region: string;
}

export function WeekSummaryCard({ daily, region: _region }: WeekSummaryCardProps) {
  if (daily.length === 0) return null;

  const totalRain = daily.reduce((sum, d) => sum + d.total_rain, 0);
  const avgProb = Math.round(daily.reduce((sum, d) => sum + d.avg_prob, 0) / daily.length);
  const bestDay = [...daily].sort((a, b) => a.avg_prob - b.avg_prob)[0];
  const worstDay = [...daily].sort((a, b) => b.total_rain - a.total_rain)[0];
  const avgTemp = Math.round(daily.reduce((sum, d) => sum + d.avg_temp, 0) / daily.length * 10) / 10;

  const bestDayLabel = new Date(bestDay.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
  const worstDayLabel = new Date(worstDay.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });

  const verdict = avgProb < 30 ? 'Mostly dry week ahead' :
    avgProb < 60 ? 'Scattered rain expected' :
    'Rainy week ahead — pack an umbrella';

  return (
    <div className="week-summary">
      <div className="week-summary-verdict">
        <span className={`verdict-badge verdict-${avgProb < 30 ? 'good' : avgProb < 60 ? 'moderate' : 'bad'}`}>
          {verdict}
        </span>
      </div>

      <div className="week-summary-stats">
        <div className="week-stat">
          <div className="week-stat-icon" aria-hidden="true">
            <DropletIcon size={16} color="var(--accent)" />
          </div>
          <div>
            <span className="stat-value">{totalRain.toFixed(1)} mm</span>
            <span className="stat-label">Expected 7-day rainfall</span>
          </div>
        </div>
        <div className="week-stat">
          <div className="week-stat-icon" aria-hidden="true">
            <ThermometerIcon size={16} color="var(--accent)" />
          </div>
          <div>
            <span className="stat-value">{avgTemp}°C</span>
            <span className="stat-label">Average daytime temp</span>
          </div>
        </div>
        <div className="week-stat">
          <div className="week-stat-icon" aria-hidden="true">
            <SunIcon size={16} color="#f59e0b" />
          </div>
          <div>
            <span className="stat-value">{bestDayLabel}</span>
            <span className="stat-label">Driest day (Best for plans)</span>
          </div>
        </div>
        <div className="week-stat">
          <div className="week-stat-icon" aria-hidden="true">
            <DropletIcon size={16} color="#dc2626" />
          </div>
          <div>
            <span className="stat-value">{worstDayLabel}</span>
            <span className="stat-label">Wettest day (Pack umbrella)</span>
          </div>
        </div>
      </div>

      <div className="week-mini-bars" aria-label="Daily precipitation probability breakdown">
        {daily.map((d) => {
          const dayName = new Date(d.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase();
          return (
            <div key={d.date} className="mini-bar-col">
              <span className="mini-bar-prob">{d.avg_prob}%</span>
              <div className="mini-bar-track">
                <div
                  className="mini-bar-fill"
                  style={{ height: `${Math.min(d.avg_prob, 100)}%` }}
                  title={`${d.avg_prob}% rain probability on ${dayName}`}
                />
              </div>
              <span className="mini-bar-label">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
