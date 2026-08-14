import { CheckCircleIcon, CloudRainIcon, SunIcon } from './Icons';
import type { HourlyData } from '../hooks/useWeatherData';
import './BestTimeToGo.css';

interface Props {
  hourly: HourlyData[];
}

function getHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function formatWindow(start: number, end: number): string {
  return `${getHourLabel(start)} - ${getHourLabel(end > 23 ? 23 : end)}`;
}

export function BestTimeToGo({ hourly }: Props) {
  if (hourly.length < 3) return null;

  let bestStart = 0;
  let bestAvg = 100;
  let worstStart = 0;
  let worstAvg = 0;

  for (let i = 0; i <= hourly.length - 3; i++) {
    const windowAvg = (
      hourly[i].precipitation_probability +
      hourly[i + 1].precipitation_probability +
      hourly[i + 2].precipitation_probability
    ) / 3;
    if (windowAvg < bestAvg) {
      bestAvg = windowAvg;
      bestStart = hourly[i].hour;
    }
    if (windowAvg > worstAvg) {
      worstAvg = windowAvg;
      worstStart = hourly[i].hour;
    }
  }

  return (
    <div className="best-time">
      <div className="best-time-card good">
        <div className="btc-icon">
          <SunIcon size={22} color="#2e7d32" />
        </div>
        <div className="btc-info">
          <span className="btc-label">Best time to go out</span>
          <strong className="btc-time">{formatWindow(bestStart, bestStart + 3)}</strong>
          <span className="btc-prob">{Math.round(bestAvg)}% rain chance</span>
        </div>
        <CheckCircleIcon size={18} color="#2e7d32" />
      </div>

      <div className="best-time-card bad">
        <div className="btc-icon">
          <CloudRainIcon size={22} color="#c62828" />
        </div>
        <div className="btc-info">
          <span className="btc-label">Avoid going out</span>
          <strong className="btc-time">{formatWindow(worstStart, worstStart + 3)}</strong>
          <span className="btc-prob">{Math.round(worstAvg)}% rain chance</span>
        </div>
        <CloudRainIcon size={18} color="#c62828" />
      </div>
    </div>
  );
}
