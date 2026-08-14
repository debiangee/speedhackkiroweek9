import { useEffect, useState, useRef, useCallback } from 'react';
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

// Philippines bounding box (proper framing)
const PH_CENTER = { lat: 12.5, lon: 121.5 };
const MIN_ZOOM = 4;
const MAX_ZOOM = 8;
const DEFAULT_ZOOM = 5;
const SIZE = 512;
const COLOR_SCHEME = 2; // Universal Blue
const OPTIONS = '1_1'; // smooth=1, snow=1

// Convert lat/lon to tile coordinates (for Slippy Map / OSM tile scheme)
function latLonToTile(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

export function WeatherRiskMap() {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [host, setHost] = useState('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pastCount, setPastCount] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState(PH_CENTER);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; lat: number; lon: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
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

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 1, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 1, MIN_ZOOM));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setCenter(PH_CENTER);
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 1, MAX_ZOOM));
    } else {
      setZoom((z) => Math.max(z - 1, MIN_ZOOM));
    }
  }, []);

  // Pan (drag) handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, lat: center.lat, lon: center.lon };
  }, [center]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    // Convert pixel delta to lat/lon delta based on zoom
    const scale = 360 / Math.pow(2, zoom) / SIZE;
    const newLon = dragStart.current.lon - dx * scale;
    const newLat = dragStart.current.lat + dy * scale;

    // Clamp to reasonable bounds
    setCenter({
      lat: Math.max(4, Math.min(21, newLat)),
      lon: Math.max(116, Math.min(128, newLon)),
    });
  }, [isDragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  // Touch support for mobile pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStart.current = { x: touch.clientX, y: touch.clientY, lat: center.lat, lon: center.lon };
    }
  }, [center]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !dragStart.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;

    const scale = 360 / Math.pow(2, zoom) / SIZE;
    const newLon = dragStart.current.lon - dx * scale;
    const newLat = dragStart.current.lat + dy * scale;

    setCenter({
      lat: Math.max(4, Math.min(21, newLat)),
      lon: Math.max(116, Math.min(128, newLon)),
    });
  }, [isDragging, zoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

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

  // Build tile URLs for a 3x3 grid around center for seamless coverage
  function getTileGrid(frame: RadarFrame) {
    const centerTile = latLonToTile(center.lat, center.lon, zoom);
    const tiles: { x: number; y: number; url: string; key: string }[] = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = centerTile.x + dx;
        const ty = centerTile.y + dy;
        const url = `${host}${frame.path}/256/${zoom}/${tx}/${ty}/${COLOR_SCHEME}/${OPTIONS}.png`;
        tiles.push({ x: dx, y: dy, url, key: `${tx}-${ty}` });
      }
    }
    return { tiles, centerTile };
  }

  // Calculate pixel offset for smooth panning within tile
  function getPixelOffset() {
    const n = Math.pow(2, zoom);
    const xFloat = ((center.lon + 180) / 360) * n;
    const latRad = (center.lat * Math.PI) / 180;
    const yFloat = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;

    // Fractional part = how far into the center tile we are
    const xFrac = xFloat - Math.floor(xFloat);
    const yFrac = yFloat - Math.floor(yFloat);

    // Convert to pixel offset (each tile is 256px in our 3x3 grid)
    const offsetX = -(xFrac * 256 + 256); // shift left by fractional + 1 tile
    const offsetY = -(yFrac * 256 + 256); // shift up by fractional + 1 tile

    return { offsetX, offsetY };
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

      {/* Radar viewport with zoom/pan */}
      <div
        className={`risk-map-viewport ${isDragging ? 'dragging' : ''}`}
        ref={viewportRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Tile grid */}
        {currentFrameData && host && (() => {
          const { tiles } = getTileGrid(currentFrameData);
          const { offsetX, offsetY } = getPixelOffset();
          return (
            <div
              className="risk-map-tile-grid"
              style={{
                transform: `translate(${offsetX + 256}px, ${offsetY + 256}px)`,
              }}
            >
              {tiles.map((tile) => (
                <img
                  key={tile.key}
                  className="risk-map-tile"
                  src={tile.url}
                  alt=""
                  draggable={false}
                  style={{
                    gridColumn: tile.x + 2,
                    gridRow: tile.y + 2,
                  }}
                />
              ))}
            </div>
          );
        })()}

        {/* Zoom controls */}
        <div className="risk-map-zoom-controls">
          <button
            className="zoom-btn"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
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
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            className="zoom-btn zoom-btn-reset"
            onClick={handleReset}
            aria-label="Reset view"
            title="Reset view"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>

        {/* Zoom level indicator */}
        <div className="risk-map-zoom-level">
          <span>{zoom}x</span>
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
        Live radar from <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>
      </p>
    </div>
  );
}
