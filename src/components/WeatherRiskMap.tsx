import { useEffect, useState, useRef } from 'react';
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

// Philippines center
const PH_LAT = 12.0;
const PH_LON = 122.0;
const ZOOM = 4;
const SIZE = 512;
const COLOR_SCHEME = 2; // Universal Blue color scheme
const OPTIONS = '1_1'; // smooth=1, snow=1

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
        // Start at the last past frame (most recent actual data)
        const pastLen = data.radar.past.length;
        setCurrentFrame(Math.max(0, pastLen - 1));
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

  function getFrameType(index: number, pastCount: number): string {
    if (index < pastCount) return 'past';
    return 'forecast';
  }

  // Build tile URL for coordinate-based rendering
  // RainViewer requires lat/lon to contain a dot (decimal format)
  function getRadarTileUrl(frame: RadarFrame): string {
    const lat = PH_LAT.toFixed(4);
    const lon = PH_LON.toFixed(4);
    return `${host}${frame.path}/${SIZE}/${ZOOM}/${lat}/${lon}/${COLOR_SCHEME}/${OPTIONS}.png`;
  }

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

      {/* Radar image display */}
      <div className="risk-map-viewport">
        {/* Use the RainViewer coordinate-based tile as radar overlay */}
        {frames.length > 0 && host && frames[currentFrame] && (
          <img
            className="risk-map-radar-img"
            src={getRadarTileUrl(frames[currentFrame])}
            alt={`Rain radar at ${getFrameLabel(frames[currentFrame])}`}
            draggable={false}
            onError={(e) => {
              // If coordinate tile fails, try without the decimal issue
              const img = e.currentTarget;
              if (!img.dataset.retried) {
                img.dataset.retried = 'true';
                const frame = frames[currentFrame];
                // Fallback: use slightly different coordinates
                img.src = `${host}${frame.path}/${SIZE}/${ZOOM}/12.8797/121.7740/${COLOR_SCHEME}/${OPTIONS}.png`;
              }
            }}
          />
        )}
        {/* No rain indicator when image loads but shows nothing */}
        {frames.length > 0 && !loading && !error && (
          <div className="risk-map-no-rain-hint">
            Dark areas = no precipitation detected
          </div>
        )}
        {/* Philippines label */}
        <div className="risk-map-region-label">🇵🇭 Philippines Radar</div>
      </div>

      {/* Controls */}
      {frames.length > 0 && (
        <div className="risk-map-controls">
          <button
            className="risk-map-play-btn"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
          >
            {playing ? '⏸' : '▶'}
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
                  className={`slider-tick ${i === currentFrame ? 'active' : ''} ${getFrameType(i, pastCount)}`}
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
