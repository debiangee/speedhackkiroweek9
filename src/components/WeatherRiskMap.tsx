import { useEffect, useRef, useState } from 'react';
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

// Philippines center coordinates
const PH_CENTER: [number, number] = [12.8797, 121.774];
const PH_ZOOM = 6;

export function WeatherRiskMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const radarLayer = useRef<L.TileLayer | null>(null);
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [host, setHost] = useState('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, {
      center: PH_CENTER,
      zoom: PH_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(leafletMap.current);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

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
        // Start at the most recent hourly frame
        const pastLen = data.radar.past.length;
        const hourMap = new Map<number, number>();
        allFrames.forEach((frame, idx) => {
          const hourKey = Math.floor(frame.time / 3600);
          if (!hourMap.has(hourKey)) {
            hourMap.set(hourKey, idx);
          }
        });
        const hourIndices = Array.from(hourMap.values()).sort((a, b) => a - b);
        // Find the closest hourly index to the most recent past frame
        let startIdx = hourIndices[hourIndices.length - 1] ?? pastLen - 1;
        for (const idx of hourIndices) {
          if (idx >= pastLen - 1) {
            startIdx = idx;
            break;
          }
        }
        setCurrentFrame(startIdx);
        setError(null);
      } catch (e) {
        setError('Could not load radar data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchRadarData();
    // Refresh every 5 minutes
    const refreshInterval = setInterval(fetchRadarData, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Update radar tile layer when frame changes
  useEffect(() => {
    if (!leafletMap.current || !host || frames.length === 0) return;

    const frame = frames[currentFrame];
    if (!frame) return;

    if (radarLayer.current) {
      leafletMap.current.removeLayer(radarLayer.current);
    }

    radarLayer.current = L.tileLayer(
      `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
      {
        opacity: 0.7,
        zIndex: 10,
        attribution: '<a href="https://www.rainviewer.com/" target="_blank">RainViewer</a>',
      }
    );

    radarLayer.current.addTo(leafletMap.current);
  }, [currentFrame, frames, host]);

  // Group frames by hour and pick the closest frame per hour
  function getHourlyFrameIndices(): number[] {
    if (frames.length === 0) return [];
    const hourMap = new Map<number, number>(); // hour key -> frame index
    frames.forEach((frame, idx) => {
      const hourKey = Math.floor(frame.time / 3600);
      if (!hourMap.has(hourKey)) {
        hourMap.set(hourKey, idx);
      }
    });
    return Array.from(hourMap.values()).sort((a, b) => a - b);
  }

  const hourlyIndices = getHourlyFrameIndices();

  // Animation playback (hour by hour)
  useEffect(() => {
    if (playing && hourlyIndices.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          const currentHourIdx = hourlyIndices.indexOf(prev);
          const nextHourIdx = (currentHourIdx + 1) % hourlyIndices.length;
          return hourlyIndices[nextHourIdx];
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playing, hourlyIndices.length]);

  function getFrameLabel(frame: RadarFrame | undefined): string {
    if (!frame) return '';
    const date = new Date(frame.time * 1000);
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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
          <span>{error}</span>
        </div>
      )}

      <div ref={mapRef} className="risk-map-container" />

      {frames.length > 0 && hourlyIndices.length > 0 && (
        <div className="risk-map-controls">
          <button
            className="risk-map-play-btn"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
          >
            {playing ? '⏸' : '▶'}
          </button>

          <input
            type="range"
            className="risk-map-slider"
            min={0}
            max={hourlyIndices.length - 1}
            value={hourlyIndices.indexOf(currentFrame) !== -1 ? hourlyIndices.indexOf(currentFrame) : 0}
            onChange={(e) => {
              setPlaying(false);
              const hourIdx = Number(e.target.value);
              setCurrentFrame(hourlyIndices[hourIdx]);
            }}
            step={1}
            aria-label="Radar frame timeline (hour by hour)"
          />

          <span className="risk-map-time">
            {getFrameLabel(frames[currentFrame])}
          </span>
        </div>
      )}

      <div className="risk-map-legend">
        <span className="legend-title">Precipitation Intensity</span>
        <div className="legend-bar">
          <span className="legend-label">Light</span>
          <div className="legend-gradient" />
          <span className="legend-label">Heavy</span>
        </div>
      </div>

      <p className="risk-map-attribution">
        Live radar data from <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>
      </p>
    </div>
  );
}
