import { HourlyData } from '../../hooks/useWeatherData';
import { isRainCondition } from '../../utils/weatherSimulation';
import { CloudRainIcon, SunIcon, CloudIcon, CloudLightningIcon, ClockIcon } from '../Icons';

interface WeatherTimelineProps {
  hourly: HourlyData[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export function WeatherTimeline({ hourly, selectedIndex, onSelectIndex }: WeatherTimelineProps) {
  // Take next 24 hours of forecast
  const visibleHours = hourly.slice(0, 24);

  if (visibleHours.length === 0) return null;

  return (
    <div className="weather-reality-timeline">
      <div className="timeline-header">
        <div className="timeline-title-row">
          <ClockIcon size={15} color="var(--accent)" />
          <span className="timeline-title">Forecast Timeline</span>
        </div>
        {selectedIndex > 0 && (
          <button className="live-reset-btn" onClick={() => onSelectIndex(0)}>
            First forecast hour
          </button>
        )}
      </div>

      <div className="timeline-track-wrapper">
        <div className="timeline-track">
          {visibleHours.map((entry, idx) => {
            const isSelected = idx === selectedIndex;
            const hourNum = entry.hour ?? new Date(entry.time).getHours();
            const h12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
            const ampm = hourNum < 12 ? 'AM' : 'PM';
            const label = `${h12}${ampm}`;

            const isRaining = isRainCondition(entry.weather_code, entry.precipitation);

            // Weather icon derived strictly from meteorological state
            let IconComp = SunIcon;
            let iconColor = '#f59e0b';
            if (entry.weather_code >= 95) {
              IconComp = CloudLightningIcon;
              iconColor = '#8b5cf6';
            } else if (isRaining) {
              IconComp = CloudRainIcon;
              iconColor = '#3b82f6';
            } else if (entry.cloud_cover > 60 || entry.weather_code === 3) {
              IconComp = CloudIcon;
              iconColor = '#94a3b8';
            } else if (entry.cloud_cover > 25 || entry.weather_code === 1 || entry.weather_code === 2) {
              IconComp = SunIcon;
              iconColor = '#f59e0b';
            }

            return (
              <button
                key={idx}
                type="button"
                className={`timeline-node ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectIndex(idx)}
                title={`${label}: ${entry.temperature}°C, ${isRaining ? `${entry.precipitation}mm rain` : 'No rain'}`}
              >
                <span className="node-time">{label}</span>
                <span className="node-icon">
                  <IconComp size={16} color={iconColor} />
                </span>
                <span className="node-temp">{Math.round(entry.temperature)}°</span>
                {isRaining ? (
                  <span className="node-rain">{entry.precipitation}mm</span>
                ) : (
                  <span className="node-dry">0mm</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

