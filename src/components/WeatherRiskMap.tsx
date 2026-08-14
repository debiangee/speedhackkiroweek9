import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './WeatherRiskMap.css';

interface RadarFrame {
  time: number;
  path: string;
}

interface RainViewerData {
  host: string;
  radar: {
    past: RadarFrame[];
    nowcast?: RadarFrame[];
  };
}

// Philippines framing + hard bounds so users stay over PH
const PH_CENTER: [number, number] = [12.5, 122.0];
const PH_BOUNDS: L.LatLngBoundsExpression = [
  [4.0, 116.0],  // SW
  [21.5, 128.0], // NE
];
const MIN_ZOOM = 5;
const MAX_ZOOM = 10;
const DEFAULT_ZOOM = 6;
const COLOR_SCHEME = 2; // Universal Blue
const OPTIONS = '1_1'; // smooth=1, snow=1

// Radar overlay layer — swaps tile URL as the animation frame changes
function RadarLayer({ host, frame }: { host: string; frame: RadarFrame | undefined }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!host || !frame) return;

    const url = `${host}${frame.path}/256/{z}/{x}/{y}/${COLOR_SCHEME}/${OPTIONS}.png`;
    const newLayer = L.tileLayer(url, {
      opacity: 0.7,
      zIndex: 400,
      tileSize: 256,
    });
    newLayer.addTo(map);

    // Remove the previous frame's layer once the new one is added
    const prev = layerRef.current;
    layerRef.current = newLayer;
    if (prev) {
      // small delay avoids flicker between frames
      setTimeout(() => map.removeLayer(prev), 120);
    }

    return () => {
      map.removeLayer(newLayer);
      if (layerRef.current === newLayer) layerRef.current = null;
    };
  }, [host, frame, map]);

  return null;
}

// Custom zoom + reset controls
function MapControls() {
  const map = useMap();
  return (
    <div className="risk-map-zoom-controls">
      <button
        className="zoom-btn"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        className="zoom-btn"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        className="zoom-btn zoom-btn-reset"
        onClick={() => map.flyTo(PH_CENTER, DEFAULT_ZOOM)}
        aria-label="Reset view"
        title="Reset view"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
}

export function WeatherRiskMap() {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [host, setHost] = useState('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pastCount, setPastCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch RainViewer radar data
  useEffect(() => {
    async function fetchRadarData() {
      try {
        setLoading(true);
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!res.ok) throw new Error('Failed to fetch radar data');
        const data: RainViewerData = await res.json();

        const allFrames = [
          ...data.radar.past,
          ...(data.radar.nowcast || []),
        ];

        setHost(data.host);
        setFrames(allFrames);
        setPastCount(data.radar.past.length);
        setCurrentFrame(Math.max(0, data.radar.past.length - 1));
        setError(null);
      } catch {
        setError('Could not load radar data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchRadarData();
    const refreshInterval = setInterval(fetchRadarData, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Animation playback
  useEffect(() => {
    if (playing && frames.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
      }, 800);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, frames.length]);

  function getFrameLabel(frame: RadarFrame | undefined): string {
    if (!frame) return '';
    const date = new Date(frame.time * 1000);
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  function getFrameType(index: number): string {
    return index < pastCount ? 'past' : 'forecast';
  }

  const currentFrameData = frames[currentFrame];

  return (
    <div className="weather-risk-map">
      {loading && (
        <div className="risk-map-loading">
          <div className="risk-map-spinner" />
          <span>Loading radar data...</span>
        </div>
      )}

      {error && (
        <div className="risk-map-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Leaflet map: OSM base + radar overlay, locked to PH */}
      <div className="risk-map-viewport">
        <MapContainer
          center={PH_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          maxBounds={PH_BOUNDS}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
          />
          <RadarLayer host={host} frame={currentFrameData} />
          <MapControls />
        </MapContainer>

        {/* Zoom level indicator */}
        <div className="risk-map-zoom-level">
          <span>PH</span>
        </div>

        {/* No rain indicator */}
        {frames.length > 0 && !loading && !error && (
          <div className="risk-map-no-rain-hint">
            Dark areas = no precipitation
          </div>
        )}

        {/* Region label */}
        <div className="risk-map-region-label">🇵🇭 Philippines Radar</div>

        {/* Pan hint */}
        <div className="risk-map-pan-hint">Drag to pan · Scroll to zoom</div>
      </div>

      {/* Timeline controls */}
      {frames.length > 0 && (
        <div className="risk-map-controls">
          <button
            className="risk-map-play-btn"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
          >
            {playing ? (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          <div className="risk-map-slider-container">
            <input
              type="range"
              className="risk-map-slider"
              min={0}
              max={frames.length - 1}
              value={currentFrame}
              onChange={(e) => {
                setPlaying(false);
                setCurrentFrame(Number(e.target.value));
              }}
              step={1}
              aria-label="Radar frame timeline"
            />
            <div className="risk-map-slider-ticks">
              {frames.map((_, i) => (
                <span
                  key={i}
                  className={`slider-tick ${i === currentFrame ? 'active' : ''} ${getFrameType(i)}`}
                />
              ))}
            </div>
          </div>

          <div className="risk-map-time-info">
            <span className="risk-map-time">
              {getFrameLabel(frames[currentFrame])}
            </span>
            {currentFrame >= pastCount && (
              <span className="risk-map-forecast-badge">Forecast</span>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="risk-map-legend">
        <span className="legend-title">Precipitation Intensity</span>
        <div className="legend-bar">
          <span className="legend-label">Light</span>
          <div className="legend-gradient" />
          <span className="legend-label">Heavy</span>
        </div>
      </div>

      <p className="risk-map-attribution">
        Radar from <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>
        {' · '}Map <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
      </p>
    </div>
  );
}
