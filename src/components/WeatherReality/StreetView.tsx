import { useState, useEffect } from 'react';
import { MapPinIcon, ExternalLinkIcon, EyeIcon, CompassIcon } from '../Icons';

interface StreetViewProps {
  lat: number;
  lon: number;
  locationName: string;
  initialHeading?: number;
  initialPitch?: number;
  fov?: number;
  onUnavailable?: () => void;
}

export function StreetView({
  lat,
  lon,
  locationName,
  initialHeading = 0,
  initialPitch = 0,
  fov = 90,
  onUnavailable,
}: StreetViewProps) {
  const [heading, setHeading] = useState(initialHeading);
  const [pitch, setPitch] = useState(initialPitch);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync heading when location changes
  useEffect(() => {
    setHeading(initialHeading);
    setPitch(initialPitch);
    setLoading(true);
    setLoadError(false);
  }, [lat, lon, initialHeading, initialPitch]);

  // Check if custom Google Maps API key is configured in env
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Generate official Street View embed URL
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${lat},${lon}&heading=${heading}&pitch=${pitch}&fov=${fov}`
    : `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lon}&cbp=11,${heading},0,${pitch},0&output=svembed`;

  // External link to open full Google Street View in new tab
  const directStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}&heading=${heading}&pitch=${pitch}&fov=${fov}`;

  // Interactive Pan / Rotate helpers
  const turnLeft = () => setHeading((h) => (h - 45 + 360) % 360);
  const turnRight = () => setHeading((h) => (h + 45) % 360);
  const lookUp = () => setPitch((p) => Math.min(45, p + 15));
  const lookDown = () => setPitch((p) => Math.max(-30, p - 15));
  const resetOrientation = () => {
    setHeading(initialHeading);
    setPitch(initialPitch);
  };

  if (loadError) {
    return (
      <div className="streetview-unavailable-state">
        <MapPinIcon size={36} color="var(--accent)" />
        <h4 className="unavailable-title">Street-Level Imagery Unavailable</h4>
        <p className="unavailable-desc">
          Street view imagery is not currently accessible for these coordinates ({lat.toFixed(4)}, {lon.toFixed(4)}) in {locationName}.
        </p>
        <div className="unavailable-actions">
          {onUnavailable && (
            <button type="button" className="switch-map-btn" onClick={onUnavailable}>
              <EyeIcon size={16} />
              <span>Switch to Real Map View</span>
            </button>
          )}
          <a
            href={directStreetViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="external-street-link"
          >
            <ExternalLinkIcon size={14} />
            <span>Open in Google Maps</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="streetview-container">
      {loading && (
        <div className="streetview-loading-overlay">
          <div className="loading-spinner" />
          <span>Loading real-world street imagery for {locationName}...</span>
        </div>
      )}

      <iframe
        title={`Real Street View of ${locationName}`}
        src={embedUrl}
        className="streetview-iframe"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setLoadError(true);
        }}
      />

      {/* Street View Directional Controls Overlay */}
      <div className="streetview-pan-controls" role="toolbar" aria-label="Street View Rotation Controls">
        <button
          type="button"
          className="pan-btn"
          onClick={turnLeft}
          title="Turn Left 45°"
          aria-label="Turn Left"
        >
          <span>↺ 45°</span>
        </button>
        <button
          type="button"
          className="pan-btn"
          onClick={lookUp}
          title="Tilt Up"
          aria-label="Tilt Up"
        >
          <span>▲ Up</span>
        </button>
        <button
          type="button"
          className="pan-btn"
          onClick={lookDown}
          title="Tilt Down"
          aria-label="Tilt Down"
        >
          <span>▼ Down</span>
        </button>
        <button
          type="button"
          className="pan-btn"
          onClick={turnRight}
          title="Turn Right 45°"
          aria-label="Turn Right"
        >
          <span>45° ↻</span>
        </button>
        <button
          type="button"
          className="pan-btn reset-btn"
          onClick={resetOrientation}
          title="Reset Orientation"
          aria-label="Reset Orientation"
        >
          <CompassIcon size={12} />
          <span>{Math.round(heading)}°</span>
        </button>
      </div>

      {/* Floating External View link */}
      <a
        href={directStreetViewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="streetview-external-badge"
        title="Open full street view in Google Maps"
      >
        <ExternalLinkIcon size={12} />
        <span>Open in Google Maps</span>
      </a>
    </div>
  );
}
