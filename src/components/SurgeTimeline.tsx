import { useRef, useState } from 'react';
import type { SurgeResult, SurgeWindow } from '../utils/surge-engine';
import { formatHour } from '../utils/surge-engine';
import { CloudRainIcon, CarIcon, BanknoteIcon, WavesIcon, ZapIcon, AlertCircleIcon, ClockIcon } from './Icons';
import './SurgeTimeline.css';

interface Props {
  results: SurgeResult[];
  bestWindow: SurgeWindow | null;
  peakWindow: SurgeWindow | null;
  currentHour: number;
}

function formatFullTime(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

function formatAxisHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
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

  function renderFactorIcon(topFactor: SurgeResult['topFactor']) {
    switch (topFactor) {
      case 'weather':
        return <CloudRainIcon size={12} color="currentColor" />;
      case 'rush_hour':
        return <CarIcon size={12} color="currentColor" />;
      case 'payday':
        return <BanknoteIcon size={12} color="currentColor" />;
      case 'sustained_rain':
        return <WavesIcon size={12} color="currentColor" />;
      default:
        return <CloudRainIcon size={12} color="currentColor" />;
    }
  }

  function formatFactorText(topFactor: SurgeResult['topFactor']) {
    switch (topFactor) {
      case 'weather':
        return 'Weather';
      case 'rush_hour':
        return 'Rush Hour';
      case 'payday':
        return 'Payday Demand';
      case 'sustained_rain':
        return 'Sustained Rain';
      default:
        return 'Conditions';
    }
  }

  return (
    <div className="surge-timeline" onKeyDown={handleKeyDown} tabIndex={0} role="group" aria-label="Hourly surge timeline">
      {/* Timeline Controls & Summary Bar */}
      <div className="timeline-header-bar">
        <div className="timeline-legend">
          <span className="legend-item"><span className="legend-dot level-low" /> Low</span>
          <span className="legend-item"><span className="legend-dot level-moderate" /> Moderate</span>
          <span className="legend-item"><span className="legend-dot level-high" /> High</span>
          <span className="legend-item"><span className="legend-dot level-extreme" /> Extreme</span>
        </div>

        <div className="timeline-window-chips">
          {peakWindow && (
            <div className="window-chip peak" title="Higher modeled demand period">
              <AlertCircleIcon size={13} color="#dc2626" />
              <span>Avoid Peak: <strong>{formatHour(peakWindow.startHour)} – {formatHour(peakWindow.endHour)}</strong></span>
            </div>
          )}
          {bestWindow && (
            <div className="window-chip best" title="Lower modeled demand period; actual availability unknown">
              <ZapIcon size={13} color="#16a34a" />
              <span>Lower score: <strong>{formatHour(bestWindow.startHour)} – {formatHour(bestWindow.endHour)}</strong></span>
            </div>
          )}
        </div>
      </div>

      <p className="timeline-helper-text">
        Hourly heuristic demand score. Colors indicate model output, not observed prices or traffic.
      </p>

      {/* Chart Surface */}
      <div className="surge-chart-container">
        <div className="surge-bars" ref={scrollRef}>
          {results.map((r, i) => {
            const isCurrent = r.hour === currentHour;
            const isFocused = activeBar === i;
            const isPeak = peakWindow && r.hour >= peakWindow.startHour && r.hour <= peakWindow.endHour;
            const isBest = bestWindow && r.hour >= bestWindow.startHour && r.hour <= bestWindow.endHour;
            const isMilestone = r.hour % 3 === 0;

            return (
              <div
                key={r.hour}
                className={`surge-bar-col ${isCurrent ? 'current' : ''} ${isFocused ? 'focused' : ''} ${isPeak ? 'in-peak' : ''} ${isBest ? 'in-best' : ''}`}
                onMouseEnter={() => setActiveBar(i)}
                onMouseLeave={() => setActiveBar(null)}
                onClick={() => setActiveBar(i)}
                role="option"
                aria-selected={isFocused}
                aria-label={`${formatFullTime(r.hour)}: Surge score ${r.score}, ${r.level}`}
              >
                {/* NOW Indicator Pill */}
                {isCurrent && (
                  <div className="now-pill" aria-hidden="true">
                    <span>NOW</span>
                  </div>
                )}

                {/* Bar Track Area (dedicated height) */}
                <div className="surge-bar-track">
                  <div
                    className={`surge-bar level-${r.level.toLowerCase()}`}
                    style={{ height: `${Math.max(r.score, 6)}%` }}
                  />
                </div>

                {/* Hour Label below baseline */}
                <div className="surge-hour-container">
                  {isCurrent || isFocused || isMilestone ? (
                    <span className={`surge-hour-label ${isCurrent ? 'current' : ''} ${isFocused ? 'focused' : ''} ${isMilestone ? 'milestone' : ''}`}>
                      {formatAxisHour(r.hour)}
                    </span>
                  ) : (
                    <span className="surge-hour-tick" aria-hidden="true" />
                  )}
                </div>

                {/* Rich Tooltip */}
                {isFocused && (
                  <div className="surge-tooltip">
                    <div className="tooltip-time">
                      <ClockIcon size={13} color="var(--accent)" />
                      <span>{formatFullTime(r.hour)}</span>
                    </div>
                    <div className="tooltip-row">
                      <span className={`tooltip-level level-text-${r.level.toLowerCase()}`}>{r.level} DEMAND</span>
                      <span className="tooltip-score">{r.score}/100</span>
                    </div>
                    <div className="tooltip-pricing">Est. pricing: <strong>{r.level} modeled demand</strong></div>
                    <div className="tooltip-factor">
                      <span className="tooltip-factor-label">Top factor:</span>
                      <span className="tooltip-factor-badge">
                        {renderFactorIcon(r.topFactor)}
                        <span>{formatFactorText(r.topFactor)}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
