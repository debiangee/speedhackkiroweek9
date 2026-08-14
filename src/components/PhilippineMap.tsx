import { useEffect, useState } from 'react';
import { FlagIcon, MapPinIcon } from './Icons';
import { getRegionNumber } from '../utils/regions';
import './PhilippineMap.css';

interface Props {
  selected: string;
  onSelect: (region: string) => void;
}

interface GeoFeature {
  type: string;
  properties: { REGION: string };
  geometry: {
    type: string;
    coordinates: number[][][][] | number[][][];
  };
}

interface GeoJSON {
  type: string;
  features: GeoFeature[];
}

// Map GeoJSON region names to our short display names
const REGION_LABELS: Record<string, string> = {
  'Metropolitan Manila': 'NCR',
  'Cordillera Administrative Region (CAR)': 'CAR',
  'Ilocos Region (Region I)': 'Ilocos',
  'Cagayan Valley (Region II)': 'Cagayan Valley',
  'Central Luzon (Region III)': 'Central Luzon',
  'CALABARZON (Region IV-A)': 'CALABARZON',
  'MIMAROPA (Region IV-B)': 'MIMAROPA',
  'Bicol Region (Region V)': 'Bicol',
  'Western Visayas (Region VI)': 'Western Visayas',
  'Central Visayas (Region VII)': 'Central Visayas',
  'Eastern Visayas (Region VIII)': 'Eastern Visayas',
  'Zamboanga Peninsula (Region IX)': 'Zamboanga Peninsula',
  'Northern Mindanao (Region X)': 'Northern Mindanao',
  'Davao Region (Region XI)': 'Davao',
  'SOCCSKSARGEN (Region XII)': 'SOCCSKSARGEN',
  'Caraga (Region XIII)': 'Caraga',
  'Autonomous Region of Muslim Mindanao (ARMM)': 'BARMM',
};

// Pin positions for each region (approximate center in geo coords)
const REGION_PINS: Record<string, { lat: number; lon: number }> = {
  'NCR': { lat: 14.6, lon: 121.0 },
  'CAR': { lat: 16.4, lon: 120.6 },
  'Ilocos': { lat: 17.6, lon: 120.4 },
  'Cagayan Valley': { lat: 17.5, lon: 121.7 },
  'Central Luzon': { lat: 15.5, lon: 120.7 },
  'CALABARZON': { lat: 14.1, lon: 121.3 },
  'MIMAROPA': { lat: 11.5, lon: 119.5 },
  'Bicol': { lat: 13.4, lon: 123.5 },
  'Western Visayas': { lat: 11.0, lon: 122.4 },
  'Central Visayas': { lat: 9.9, lon: 123.7 },
  'Eastern Visayas': { lat: 11.0, lon: 125.0 },
  'Zamboanga Peninsula': { lat: 7.8, lon: 122.6 },
  'Northern Mindanao': { lat: 8.3, lon: 124.5 },
  'Davao': { lat: 7.0, lon: 125.6 },
  'SOCCSKSARGEN': { lat: 6.5, lon: 124.9 },
  'Caraga': { lat: 9.0, lon: 125.8 },
  'BARMM': { lat: 7.2, lon: 124.0 },
};

// Projection: convert geo coordinates to SVG space
const MAP_BOUNDS = { minLon: 117, maxLon: 127, minLat: 5, maxLat: 20 };
const SVG_WIDTH = 450;
const SVG_HEIGHT = 680;

function projectX(lon: number): number {
  return ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * SVG_WIDTH;
}

function projectY(lat: number): number {
  return ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * SVG_HEIGHT;
}

function coordsToPath(coords: number[][]): string {
  return coords
    .map((point, i) => {
      const x = projectX(point[0]);
      const y = projectY(point[1]);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

function geometryToPath(geometry: GeoFeature['geometry']): string {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as number[][][];
    return rings.map((ring) => coordsToPath(ring)).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    const polys = geometry.coordinates as number[][][][];
    return polys
      .map((poly) => poly.map((ring) => coordsToPath(ring)).join(' '))
      .join(' ');
  }
  return '';
}

// Cache GeoJSON globally so it never refetches
let geoCache: GeoJSON | null = null;

export function PhilippineMap({ selected, onSelect }: Props) {
  const [geoData, setGeoData] = useState<GeoJSON | null>(geoCache);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  useEffect(() => {
    if (geoCache) {
      setGeoData(geoCache);
      return;
    }
    fetch('/data/ph-regions.json')
      .then((res) => res.json())
      .then((data) => {
        geoCache = data;
        setGeoData(data);
      })
      .catch((err) => console.error('Failed to load map:', err));
  }, []);

  if (!geoData) {
    return (
      <div className="ph-map-container">
        <div className="map-loading">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="ph-map-container">
      <h2 className="map-title"><FlagIcon size={18} color="var(--accent)" /> Philippines</h2>
      <p className="map-subtitle">Tap a region to see the rain forecast</p>

      <div className="map-wrapper">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="ph-map-svg"
          role="img"
          aria-label="Interactive map of Philippine regions"
        >
          {/* Water background */}
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#dceefb" />

          {/* Region shapes */}
          {geoData.features.map((feature) => {
            const regionName = REGION_LABELS[feature.properties.REGION] || feature.properties.REGION;
            const isSelected = regionName === selected;
            const isHovered = regionName === hoveredRegion;
            const pathData = geometryToPath(feature.geometry);

            return (
              <path
                key={feature.properties.REGION}
                d={pathData}
                className={`region-path ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                onClick={() => onSelect(regionName)}
                onMouseEnter={() => setHoveredRegion(regionName)}
                onMouseLeave={() => setHoveredRegion(null)}
                role="button"
                tabIndex={0}
                aria-label={`${regionName} region`}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(regionName);
                  }
                }}
              />
            );
          })}

          {/* Region pins */}
          {Object.entries(REGION_PINS).map(([region, pos]) => {
            const x = projectX(pos.lon);
            const y = projectY(pos.lat);
            const isSelected = region === selected;
            const isHovered = region === hoveredRegion;

            return (
              <g
                key={region}
                className={`region-pin ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(region)}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse ring for selected */}
                {isSelected && (
                  <circle cx={x} cy={y} r={16} className="pin-pulse" />
                )}
                {/* Larger transparent hit area for touch */}
                <circle cx={x} cy={y} r={18} fill="transparent" />
                {/* Pin marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 9 : isHovered ? 8 : 6.5}
                  className="pin-dot"
                />
                {/* Label */}
                {(isSelected || isHovered) && (
                  <g className="pin-label-group">
                    <rect
                      x={x + 11}
                      y={y - 11}
                      width={getRegionNumber(region).length * 7 + 14}
                      height={20}
                      rx={4}
                      className="pin-label-bg"
                    />
                    <text x={x + 17} y={y + 3} className="pin-label-text">
                      {getRegionNumber(region)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected region badge */}
      <div className="selected-region-badge">
        <MapPinIcon size={16} color="var(--accent)" />
        <div className="badge-text-wrap">
          <strong>{getRegionNumber(selected)}</strong>
          <span className="badge-subtext">{selected}</span>
        </div>
      </div>
    </div>
  );
}
