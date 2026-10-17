import { useState } from 'react';
import { WeatherSimulationState, deriveExperienceReport } from '../../utils/weatherSimulation';
import {
  ThermometerIcon,
  DropletIcon,
  WindIcon,
  EyeIcon,
  InfoIcon,
  MapPinIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '../Icons';

interface WeatherStatusPanelProps {
  locationName: string;
  lat: number;
  lon: number;
  simState: WeatherSimulationState;
  isForecastMode: boolean;
  viewMode: 'street' | 'map' | 'split';
}

export function WeatherStatusPanel({
  locationName,
  lat,
  lon,
  simState,
  isForecastMode,
  viewMode,
}: WeatherStatusPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const exp = deriveExperienceReport(simState);

  return (
    <div className={`weather-reality-status-panel ${isMinimized ? 'minimized' : ''}`}>
      {/* Location & Mode Badge */}
      <div className="status-panel-header">
        <div className="location-row">
          <div className="location-info">
            <MapPinIcon size={14} color="var(--accent)" />
            <span className="location-name">{locationName}</span>
          </div>
          <div className="panel-header-actions">
            <span className={`status-pill ${isForecastMode ? 'forecast' : 'live'}`}>
              <span className="status-dot" />
              {isForecastMode ? `Forecast (${simState.formattedTime})` : 'Live Weather'}
            </span>
            <button
              type="button"
              className="panel-collapse-btn"
              onClick={() => setIsMinimized(!isMinimized)}
              aria-label={isMinimized ? 'Expand weather details' : 'Minimize weather details'}
              title={isMinimized ? 'Expand weather details' : 'Minimize weather details'}
            >
              {isMinimized ? <ChevronDownIcon size={15} /> : <ChevronUpIcon size={15} />}
            </button>
          </div>
        </div>

        {isMinimized ? (
          <div
            className="minimized-summary"
            onClick={() => setIsMinimized(false)}
            role="button"
            tabIndex={0}
            title="Click to view full weather details"
          >
            <div className="minimized-condition-badge">
              <span className="minimized-condition">{simState.weatherCondition}</span>
              <span className="minimized-temp">{simState.temperatureC}°C</span>
            </div>
            <span className="minimized-hint">Tap for details ▾</span>
          </div>
        ) : (
          <>
            <div className="coords-badge">
              {lat.toFixed(4)}° N, {lon.toFixed(4)}° E &bull; {viewMode === 'street' ? 'Real Street View' : viewMode === 'map' ? 'Satellite / Map' : 'Split View'}
            </div>
            <h3 className="condition-title">{simState.weatherCondition}</h3>
          </>
        )}
      </div>

      {!isMinimized && (
        <div className="status-panel-body">
          {/* Primary Telemetry Grid */}
          <div className="telemetry-grid">
            <div className="telemetry-item">
              <div className="telemetry-label">
                <ThermometerIcon size={13} color="var(--accent)" />
                <span>Temp</span>
              </div>
          <div className="telemetry-val">{simState.temperatureC}°C</div>
          <span className="telemetry-sub">Feels {simState.apparentTempC}°C</span>
        </div>

        <div className="telemetry-item">
          <div className="telemetry-label">
            <DropletIcon size={13} color="var(--accent)" />
            <span>Precipitation</span>
          </div>
          <div className="telemetry-val">{simState.precipitationMm} mm/h</div>
          <span className="telemetry-sub">{simState.shouldShowRain ? 'Active Rain' : 'No Rain'}</span>
        </div>

        <div className="telemetry-item">
          <div className="telemetry-label">
            <WindIcon size={13} color="var(--accent)" />
            <span>Wind</span>
          </div>
          <div className="telemetry-val">{simState.windSpeedKmh} km/h</div>
          <span className="telemetry-sub">{simState.windDirectionDeg}° heading</span>
        </div>

        <div className="telemetry-item">
          <div className="telemetry-label">
            <EyeIcon size={13} color="var(--accent)" />
            <span>Visibility</span>
          </div>
          <div className="telemetry-val">{(simState.visibilityMeters / 1000).toFixed(1)} km</div>
          <span className="telemetry-sub">Clouds {simState.cloudCoverage}%</span>
        </div>
      </div>

      {/* What You Would Experience Section */}
      <div className="experience-section">
        <div className="experience-title">
          <span>What You Would Experience</span>
        </div>
        <div className="experience-list">
          <div className="exp-row">
            <span className="exp-key">Road Surface:</span>
            <span className="exp-value">{exp.roadStatus}</span>
          </div>
          <div className="exp-row">
            <span className="exp-key">Atmosphere:</span>
            <span className="exp-value">{exp.visibilityStatus}</span>
          </div>
          <div className="exp-row">
            <span className="exp-key">Travel Impact:</span>
            <span className="exp-value highlight">{exp.travelSafety}</span>
          </div>
        </div>
      </div>

      {/* Real Imagery vs Weather Data Disclosure */}
      <div className="simulation-disclaimer">
        <InfoIcon size={14} color="var(--text-muted)" />
        <div>
          <strong>Street imagery may have been captured previously.</strong> Current weather data is provided by the application's live meteorological sources. Weather effects shown over the imagery are visual simulations.
        </div>
      </div>

      {/* Debug Diagnostics Toggle */}
      <div className="debug-toggle-wrapper">
        <button
          type="button"
          className="debug-toggle-btn"
          onClick={() => setShowDebug(!showDebug)}
        >
          <span>{showDebug ? '▲ Hide Meteorological Diagnostics' : '▼ Meteorological Diagnostics'}</span>
        </button>

        {showDebug && (
          <div className="weather-debug-panel" role="region" aria-label="Weather Debug Data">
            <div className="debug-panel-title">METEOROLOGICAL DIAGNOSTICS</div>
            <div className="debug-grid">
              <div className="debug-row">
                <span className="d-key">WMO Code:</span>
                <span className="d-val">{simState.weatherCode}</span>
              </div>
              <div className="debug-row">
                <span className="d-key">Precipitation:</span>
                <span className="d-val">{simState.precipitationMm} mm/h</span>
              </div>
              <div className="debug-row">
                <span className="d-key">Cloud Cover:</span>
                <span className="d-val">{simState.cloudCoverage}%</span>
              </div>
              <div className="debug-row">
                <span className="d-key">Wind Speed:</span>
                <span className="d-val">{simState.windSpeedKmh} km/h</span>
              </div>
              <div className="debug-row">
                <span className="d-key">Derived State:</span>
                <span className="d-val highlight">{simState.condition.toUpperCase()}</span>
              </div>
              <div className="debug-row">
                <span className="d-key">Rain Effect:</span>
                <span className={`d-val ${simState.shouldShowRain ? 'active' : 'inactive'}`}>
                  {simState.shouldShowRain ? 'ON' : 'OFF (Zero Rain)'}
                </span>
              </div>
              <div className="debug-row">
                <span className="d-key">Rain Particles:</span>
                <span className="d-val">{simState.rainParticleCount}</span>
              </div>
              <div className="debug-row">
                <span className="d-key">Wet Road Effect:</span>
                <span className="d-val">{simState.wetness > 0 ? `${Math.round(simState.wetness * 100)}%` : 'OFF (Dry)'}</span>
              </div>
            </div>
            <div className="debug-verification">
              {simState.shouldShowRain ? (
                <span className="verified-rain">
                  <AlertCircleIcon size={12} color="#38bdf8" />
                  Measurable rain reported ({simState.precipitationMm} mm/h) &bull; Rain visualization active
                </span>
              ) : (
                <span className="verified-dry">
                  <CheckCircleIcon size={12} color="#4ade80" />
                  No precipitation detected &bull; Rain visualization strictly disabled (0 drops)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
      )}
    </div>
  );
}


