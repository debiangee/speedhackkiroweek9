import { useWeatherData } from '../../hooks/useWeatherData';
import { useRef } from 'react';
import { useClock } from '../../hooks/useClock';
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
  const now = useClock();
  // The parent forecast is not assumed to describe a different imagery landmark.
  void hourly;
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
  const scene = useWeatherData(region, currentCoords);
  const sceneHours = remainingForecast(scene.hourly, now);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isExpanded) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = rootRef.current;
    root?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setIsExpanded(false); }
      if (e.key === 'Tab' && root) {
        const controls = Array.from(root.querySelectorAll<HTMLElement>('button, a[href], input, iframe, [tabindex="0"]')).filter(el => el.getClientRects().length && !el.hasAttribute('disabled'));
        const first = controls[0], last = controls[controls.length-1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === root)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown',keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown',keydown); previous?.focus(); };
  }, [isExpanded]);
  useEffect(() => { setTimelineIndex(0); }, [currentCoords.lat, currentCoords.lon]);
  const locationName = activeLandmark
    ? activeLandmark.name
    : selectedCity
    ? `${selectedCity}, ${region}`
    : regionProfile.cityName;

  // Sync timeline offset if passed from Kuya Weather
  useEffect(() => {
    if (initialForecastHourOffset >= 0 && initialForecastHourOffset < sceneHours.length) {
      setTimelineIndex(initialForecastHourOffset);
    }
  }, [initialForecastHourOffset, sceneHours.length]);

  // Derive simulation state from current hourly data and timeline index
  const simState = useMemo<WeatherSimulationState | null>(() => {
    const entry = sceneHours[timelineIndex] || sceneHours[0];
    return entry ? mapWeatherToSimulation(entry) : null;
  }, [sceneHours, timelineIndex]);
  if (!simState || scene.loading || scene.error) return <div className="section-card"><h3>Weather Reality</h3><p role="status">{scene.loading ? 'Loading a forecast for the imagery coordinates…' : scene.error || 'No valid forecast for this imagery point.'}</p>{scene.error && <button onClick={scene.refetch}>Retry imagery-point forecast</button>}</div>;

  const isForecastMode = true;

  return (
    <div ref={rootRef} tabIndex={-1} role={isExpanded ? 'dialog' : 'region'} aria-modal={isExpanded || undefined} aria-label="Weather Reality simulation" className={`weather-reality-card ${isExpanded ? 'fullscreen-mode' : ''}`}>
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

      <p>Imagery is a curated regional landmark, not necessarily the selected city. Weather is requested for the displayed imagery coordinates; the overlay is a model simulation, not observed street conditions.</p>
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
        hourly={sceneHours}
        selectedIndex={timelineIndex}
        onSelectIndex={setTimelineIndex}
      />
    </div>
  );
}

export default WeatherReality;
