import { parseRadar } from '../../services/radar';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LayersIcon, DropletIcon } from '../Icons';

// Custom Pin Icon
const pinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `
    <div style="
      background-color: #ef4444;
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

interface RealWorldMapProps {
  lat: number;
  lon: number;
  locationName: string;
  zoom?: number;
  onLocationChange?: (lat: number, lon: number) => void;
}

function MapUpdater({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], zoom, { animate: true });
  }, [lat, lon, zoom, map]);
  return null;
}

export function RealWorldMap({
  lat,
  lon,
  locationName,
  zoom = 15,
}: RealWorldMapProps) {
  const [mapType, setMapType] = useState<'satellite' | 'streets'>('satellite');
  const [showRadar, setShowRadar] = useState(true);
  const [radarPath, setRadarPath] = useState<string | null>(null);

  // Fetch latest RainViewer radar layer timestamp
  useEffect(() => {
    async function fetchRadarTimestamp() {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {cache:'no-store',signal:AbortSignal.timeout(12000)});
        if (res.ok) {
          const data = parseRadar(await res.json());
          if (data.radar && data.radar.past && data.radar.past.length > 0) {
            const latest = data.radar.past[data.radar.past.length - 1];
            setRadarPath(latest.path);
          }
        }
      } catch {
        // Fallback silently if radar is temporarily offline
      }
    }
    fetchRadarTimestamp();
  }, []);

  return (
    <div className="real-world-map-container">
      {!radarPath && <p role="status">Radar unavailable or loading; absence of radar is not evidence of no rain.</p>}
      {/* Map Controls */}
      <div className="map-toolbar">
        <div className="map-layer-toggles">
          <button
            type="button"
            className={`map-tool-btn ${mapType === 'satellite' ? 'active' : ''}`}
            onClick={() => setMapType('satellite')}
          >
            <LayersIcon size={14} />
            <span>Satellite</span>
          </button>
          <button
            type="button"
            className={`map-tool-btn ${mapType === 'streets' ? 'active' : ''}`}
            onClick={() => setMapType('streets')}
          >
            <span>Streets</span>
          </button>
        </div>

        <button
          type="button"
          className={`map-tool-btn radar-btn ${showRadar ? 'active' : ''}`}
          onClick={() => setShowRadar(!showRadar)}
          title="Toggle live rain radar overlay"
        >
          <DropletIcon size={14} color={showRadar ? '#38bdf8' : 'currentColor'} />
          <span>Live Radar</span>
        </button>
      </div>

      <MapContainer
        center={[lat, lon]}
        zoom={zoom}
        className="leaflet-map-view"
        zoomControl={true}
        attributionControl={true}
      >
        <MapUpdater lat={lat} lon={lon} zoom={zoom} />

        {/* Base Tile Layer */}
        {mapType === 'satellite' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {/* RainViewer Live Radar Overlay */}
        {showRadar && radarPath && (
          <TileLayer
            attribution='Radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
            url={`https://tilecache.rainviewer.com${radarPath}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.65}
            zIndex={200}
          />
        )}

        <Marker position={[lat, lon]} icon={pinIcon}>
          <Popup>
            <div className="map-marker-popup">
              <strong>{locationName}</strong>
              <br />
              <span className="coords-text">
                {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
