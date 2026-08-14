import { type ReactNode } from 'react';
import { StormIcon, CloudRainIcon, CloudSunRainIcon, CloudSunIcon, SunIcon } from './Icons';
import { getProbabilitySeverity } from '../utils/rain-severity';
import type { HourlyData } from '../hooks/useWeatherData';
import './HourlyTimeline.css';

interface Props {
  hourly: HourlyData[];
}

function getHourLabel(hour: number): string {
  if (hour === 0) return '12AM';
  if (hour === 12) return '12PM';
  if (hour < 12) return `${hour}AM`;
  return `${hour - 12}PM`;
}

function getRainIcon(prob: number, precip: number): ReactNode {
  if (precip > 15) return <StormIcon size={16} color="#b71c1c" />;
  if (precip > 7.5) return <CloudRainIcon size={16} color="#ef5350" />;
  if (prob >= 50) return <CloudSunRainIcon size={16} color="#ffa726" />;
  if (prob >= 25) return <CloudSunIcon size={16} color="#66bb6a" />;
  return <SunIcon size={16} color="#4caf50" />;
}

export function HourlyTimeline({ hourly }: Props) {
  if (hourly.length === 0) {
    return <p className="timeline-loading">No hourly data available</p>;
  }

  const nowHour = new Date().getHours();

  return (
    <div className="hourly-timeline" role="list" aria-label="Hourly rain forecast">
      <div className="timeline-scroll">
        {hourly.map((h) => {
          const severity = getProbabilitySeverity(h.precipitation_probability);
          return (
            <div
              key={h.hour}
              className={`hour-slot ${h.hour === nowHour ? 'current' : ''}`}
              role="listitem"
              aria-label={`${getHourLabel(h.hour)}: ${h.precipitation_probability}% rain, ${Math.round(h.temperature)} degrees`}
            >
              <span className="hour-time">{getHourLabel(h.hour)}</span>
              <span className="hour-icon">{getRainIcon(h.precipitation_probability, h.precipitation)}</span>
              <div
                className="hour-prob-bar"
                style={{
                  background: severity.color,
                  height: `${Math.max(6, h.precipitation_probability * 0.5)}px`,
                }}
              >
                <span className="hour-prob-text" style={{ color: h.precipitation_probability >= 40 ? 'white' : '#1f2937' }}>
                  {h.precipitation_probability}%
                </span>
              </div>
              <span className="hour-temp">{Math.round(h.temperature)}{'\u00B0'}</span>
            </div>
          );
        })}
      </div>
      {/* Severity legend */}
      <div className="severity-legend" aria-label="Rain severity legend">
        <span className="legend-dot" style={{ background: '#4caf50' }}></span><span>Clear</span>
        <span className="legend-dot" style={{ background: '#66bb6a' }}></span><span>Light</span>
        <span className="legend-dot" style={{ background: '#ffa726' }}></span><span>Moderate</span>
        <span className="legend-dot" style={{ background: '#ef5350' }}></span><span>Heavy</span>
        <span className="legend-dot" style={{ background: '#b71c1c' }}></span><span>Extreme</span>
      </div>
    </div>
  );
}
