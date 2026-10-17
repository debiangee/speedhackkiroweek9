import { useState, useMemo, useEffect } from 'react';
import { HourlyData } from '../../hooks/useWeatherData';
import {
  WeatherSimulationState,
  mapWeatherToSimulation,
} from '../../utils/weatherSimulation';
import {
  PHILIPPINE_STREET_LOCATIONS,
  getStreetLocationForRegion,
  StreetLandmark,
} from '../../utils/philippineStreetCoordinates';
import { StreetView } from './StreetView';
import { RealWorldMap } from './RealWorldMap';
import { WeatherOverlay } from './WeatherOverlay';
import { WeatherStatusPanel } from './WeatherStatusPanel';
import { WeatherTimeline } from './WeatherTimeline';
import {
  SparklesIcon,
  MaximizeIcon,
  MinimizeIcon,
  EyeIcon,
  MapPinIcon,
  LayersIcon,
} from '../Icons';
import './WeatherReality.css';
import { remainingForecast } from '../../utils/time';

interface WeatherRealityProps {
  region: string;
  selectedCity?: string | null;
  hourly: HourlyData[];
  initialForecastHourOffset?: number;
  isModal?: boolean;
  onClose?: () => void;
}

export function WeatherReality({
  region,
  selectedCity,
  hourly,
  initialForecastHourOffset = 0,
  isModal = false,
  onClose,
}: WeatherRealityProps) {
  hourly = remainingForecast(hourly);
  const [timelineIndex, setTimelineIndex] = useState(initialForecastHourOffset);
  const [viewMode, setViewMode] = useState<'street' | 'map' | 'split'>('street');
  const [showOverlay, setShowOverlay] = useState(true);
  const [isExpanded, setIsExpanded] = useState(isModal);
  const [activeLandmark, setActiveLandmark] = useState<StreetLandmark | null>(null);

  // Available landmarks for this region
  const regionProfile = useMemo(() => {
    return PHILIPPINE_STREET_LOCATIONS[region] || PHILIPPINE_STREET_LOCATIONS['NCR'];
  }, [region]);

  // Update active landmark when region or selectedCity changes
  useEffect(() => {
    const defaultLoc = getStreetLocationForRegion(region, selectedCity);
    setActiveLandmark(defaultLoc);
  }, [region, selectedCity]);

  // Active coordinates
  const currentCoords = activeLandmark || regionProfile.defaultSpot;
  const locationName = activeLandmark
    ? activeLandmark.name
    : selectedCity
    ? `${selectedCity}, ${region}`
    : regionProfile.cityName;

  // Sync timeline offset if passed from Kuya Weather
  useEffect(() => {
    if (initialForecastHourOffset >= 0 && initialForecastHourOffset < hourly.length) {
      setTimelineIndex(initialForecastHourOffset);
    }
  }, [initialForecastHourOffset, hourly.length]);

  // Derive simulation state from current hourly data and timeline index
  const simState = useMemo<WeatherSimulationState>(() => {
    if (!hourly || hourly.length === 0) {
      return mapWeatherToSimulation({
        time: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours(),
        temperature: 28,
        humidity: 75,
        precipitation: 0,
        precipitation_probability: 10,
        wind_speed: 10,
        wind_gusts: 15,
        weather_code: 1,
        cloud_cover: 30,
        dew_point: 22,
        visibility: 10000,
        uv_index: 5,
      });
    }

    const currentEntry = hourly[timelineIndex] || hourly[0];
    return mapWeatherToSimulation(currentEntry);
  }, [hourly, timelineIndex]);

  const isForecastMode = true;

  return (
    <div className={`weather-reality-card ${isExpanded ? 'fullscreen-mode' : ''}`}>
      {/* Header */}
      <div className="weather-reality-header">
        <div className="title-group">
          <div className="badge-pill">
            <SparklesIcon size={14} color="var(--accent)" />
            <span>Weather Reality</span>
          </div>
          <h2 className="main-title">Real-World Street Experience</h2>
          <p className="subtitle">See the real place. Understand the real weather.</p>
        </div>

        <div className="header-controls">
          {/* View Mode Switcher */}
          <div className="view-mode-selector" role="group" aria-label="View Mode">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'street' ? 'active' : ''}`}
              onClick={() => setViewMode('street')}
              title="Real Street-Level View"
            >
              <EyeIcon size={14} />
              <span>Street View</span>
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              title="Satellite / Geographic Map"
            >
              <LayersIcon size={14} />
              <span>Real Map</span>
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Split Street & Map View"
            >
              <span>Split</span>
            </button>
          </div>

          {/* Toggle Weather Visualization Layer */}
          <button
            type="button"
            className={`overlay-toggle-btn ${showOverlay ? 'active' : ''}`}
            onClick={() => setShowOverlay(!showOverlay)}
            title="Toggle weather visualization overlay"
          >
            <span>Weather Overlay</span>
          </button>

          {/* Fullscreen / Expand Toggle */}
          <button
            type="button"
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand Simulation'}
            aria-label={isExpanded ? 'Collapse' : 'Expand Simulation'}
          >
            {isExpanded ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
          </button>

          {isModal && onClose && (
            <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Curated Street Landmark Spotlights */}
      {regionProfile.landmarks && regionProfile.landmarks.length > 1 && (
        <div className="landmark-chips-bar" role="group" aria-label="Iconic Street Locations">
          <span className="landmark-bar-label">
            <MapPinIcon size={13} color="var(--accent)" />
            <span>Street Spots:</span>
          </span>
          <div className="landmark-chips-scroll">
            {regionProfile.landmarks.map((lm) => {
              const isSelected = activeLandmark?.id === lm.id;
              return (
                <button
                  key={lm.id}
                  type="button"
                  className={`landmark-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setActiveLandmark(lm);
                    if (viewMode === 'map') setViewMode('street');
                  }}
                  title={lm.description}
                >
                  <span>{lm.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p>Imagery is a curated regional landmark, not necessarily the selected city. Weather uses the selected forecast point and does not verify conditions at the landmark.</p>
      {/* Main Viewport Container */}
      <div className="simulation-stage-container">
        <div className={`simulation-stage view-mode-${viewMode}`}>
          {/* Street View Section */}
          {(viewMode === 'street' || viewMode === 'split') && (
            <div className="streetview-wrapper">
              <StreetView
                lat={currentCoords.lat}
                lon={currentCoords.lon}
                locationName={locationName}
                initialHeading={currentCoords.heading}
                initialPitch={currentCoords.pitch}
                onUnavailable={() => setViewMode('map')}
              />
              <WeatherOverlay simState={simState} enabled={showOverlay} />
            </div>
          )}

          {/* Real Map Section */}
          {(viewMode === 'map' || viewMode === 'split') && (
            <div className="mapview-wrapper">
              <RealWorldMap
                lat={currentCoords.lat}
                lon={currentCoords.lon}
                locationName={locationName}
              />
              {viewMode === 'map' && <WeatherOverlay simState={simState} enabled={showOverlay} />}
            </div>
          )}

          {/* Overlaid Telemetry Panel */}
          <WeatherStatusPanel
            locationName={locationName}
            lat={currentCoords.lat}
            lon={currentCoords.lon}
            simState={simState}
            isForecastMode={isForecastMode}
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Forecast Timeline Bar */}
      <WeatherTimeline
        hourly={hourly}
        selectedIndex={timelineIndex}
        onSelectIndex={setTimelineIndex}
      />
    </div>
  );
}

export default WeatherReality;
