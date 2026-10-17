import { findBestAndWorstWindows, formatWindow } from '../utils/best-time';
import { CheckCircleIcon, CloudRainIcon, SunIcon } from './Icons';
import { remainingForecast } from '../utils/time';
import type { HourlyData } from '../hooks/useWeatherData';
import './BestTimeToGo.css';

interface Props {
  hourly: HourlyData[];
}

export function BestTimeToGo({ hourly }: Props) {
  hourly = remainingForecast(hourly);
  const result = findBestAndWorstWindows(hourly);
  if (!result) return null;
  const { bestStart, bestAvg, worstStart, worstAvg } = result;

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
