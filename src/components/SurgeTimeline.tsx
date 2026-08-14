import { useRef, useState } from 'react';
import type { SurgeResult, SurgeWindow } from '../utils/surge-engine';
import { getMultiplierLabel, formatHour } from '../utils/surge-engine';
import './SurgeTimeline.css';

interface Props {
  results: SurgeResult[];
  bestWindow: SurgeWindow | null;
  peakWindow: SurgeWindow | null;
  currentHour: number;
}

export function SurgeTimeline({ results, bestWindow, peakWindow, currentHour }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeBar, setActiveBar] = useState<number | null>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' && activeBar !== null && activeBar < results.length - 1) {
      setActiveBar(activeBar + 1);
    } else if (e.key === 'ArrowLeft' && activeBar !== null && activeBar > 0) {
      setActiveBar(activeBar - 1);
    }
  }

  return (
    <div className="surge-timeline" onKeyDown={handleKeyDown} tabIndex={0} role="group" aria-label="Hourly surge timeline">
      {/* Peak window label */}
      {peakWindow && (
        <div
          className="surge-window-label peak"
          style={{
            left: `${(peakWindow.startHour / 24) * 100}%`,
            width: `${(peakWindow.length / 24) * 100}%`,
          }}
        >
          Avoid booking
        </div>
      )}

      <div className="surge-bars" ref={scrollRef}>
        {results.map((r, i) => (
          <div
            key={r.hour}
            className={`surge-bar-wrapper ${r.hour === currentHour ? 'current' : ''} ${activeBar === i ? 'focused' : ''}`}
            onMouseEnter={() => setActiveBar(i)}
            onMouseLeave={() => setActiveBar(null)}
            onClick={() => setActiveBar(i)}
            role="option"
            aria-selected={activeBar === i}
            aria-label={`${formatHour(r.hour)}: Surge score ${r.score}, ${r.level}`}
          >
            <div
              className={`surge-bar level-${r.level.toLowerCase()}`}
              style={{ height: `${Math.max(r.score, 4)}%` }}
            />
            <span className="surge-hour-label">
              {r.hour === 0 ? '12a' : r.hour === 12 ? '12p' : r.hour < 12 ? `${r.hour}a` : `${r.hour - 12}p`}
            </span>

            {/* Tooltip */}
            {activeBar === i && (
              <div className="surge-tooltip">
                <strong>{formatHour(r.hour)}</strong>
                <span className={`tooltip-level level-text-${r.level.toLowerCase()}`}>{r.level}</span>
                <span>Score: {r.score}/100</span>
                <span>Est. pricing: {getMultiplierLabel(r.level)}</span>
                <span className="tooltip-factor">
                  Top factor: {r.topFactor === 'weather' ? '🌧️ Weather' : r.topFactor === 'rush_hour' ? '🚗 Rush hour' : r.topFactor === 'payday' ? '💰 Payday' : '🌊 Sustained rain'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Best window label */}
      {bestWindow && (
        <div
          className="surge-window-label best"
          style={{
            left: `${(bestWindow.startHour / 24) * 100}%`,
            width: `${(bestWindow.length / 24) * 100}%`,
          }}
        >
          Best time to book
        </div>
      )}
    </div>
  );
}
