import { useState } from 'react';
import { type DailySummary } from '../hooks/useWeatherData';
import { getRegionLabel } from '../utils/regions';
import './ShareForecast.css';

interface ShareForecastProps {
  region: string;
  daily: DailySummary[];
  selectedCity?: string | null;
}

export function ShareForecast({ region, daily, selectedCity }: ShareForecastProps) {
  const [copied, setCopied] = useState(false);

  const location = selectedCity || getRegionLabel(region);
  const today = daily[0];

  if (!today) return null;

  const shareText = `${location} Weather\n` +
    `Rain: ${today.avg_prob}% chance | ${today.total_rain}mm expected\n` +
    `Temp: ${today.min_temp}°–${today.max_temp}°C\n` +
    `— via Weather Lang`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Weather: ${location}`,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await handleCopy();
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText + '\n' + window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  }

  return (
    <div className="share-forecast">
      <button className="share-btn" onClick={handleShare} aria-label="Share forecast">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {copied ? 'Copied!' : 'Share'}
      </button>
    </div>
  );
}
