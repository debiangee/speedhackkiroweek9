import { requestForecast } from '../services/forecast-provider';
import { manilaDate } from '../utils/time';
import { REGION_COORDS } from '../utils/locations';
import { useState, useEffect, useMemo } from 'react';
import { DropletIcon } from './Icons';
import './RainHeatmap.css';

// Region center coordinates for API calls


// Map region names from GeoJSON to our data keys
const REGION_NAME_MAP: Record<string, string> = {
  'Cordillera Administrative Region (CAR)': 'CAR',
  'National Capital Region (NCR)': 'NCR',
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

interface RegionRain {
  region: string;
  rainMm: number | null;
  probability: number | null;
}

interface GeoFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][][] | number[][][];
  };
  properties: { REGION: string };
}

// Color based on rain intensity
function getRainColor(rainMm: number): string {
  if (rainMm <= 1) return '#a8e6cf';
  if (rainMm <= 5) return '#88d8b0';
  if (rainMm <= 10) return '#ffd93d';
  if (rainMm <= 20) return '#ff9f43';
  if (rainMm <= 40) return '#ee5a24';
  return '#c0392b';
}

function getRainFill(rainMm: number): string {
  if (rainMm <= 1) return 'rgba(168, 230, 207, 0.4)';
  if (rainMm <= 5) return 'rgba(136, 216, 176, 0.5)';
  if (rainMm <= 10) return 'rgba(255, 217, 61, 0.5)';
  if (rainMm <= 20) return 'rgba(255, 159, 67, 0.55)';
  if (rainMm <= 40) return 'rgba(238, 90, 36, 0.6)';
  return 'rgba(192, 57, 43, 0.65)';
}

// Projection: convert lat/lon to SVG coordinates
const BOUNDS = { minLon: 116.5, maxLon: 127.5, minLat: 4.5, maxLat: 21 };
const SVG_W = 280;
const SVG_H = 420;

function projectX(lon: number): number {
  return ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * SVG_W;
}
function projectY(lat: number): number {
  return ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * SVG_H;
}

// Convert a polygon ring to SVG path
function ringToPath(ring: number[][]): string {
  return ring.map((pt, i) => `${i === 0 ? 'M' : 'L'}${projectX(pt[0]).toFixed(1)},${projectY(pt[1]).toFixed(1)}`).join(' ') + ' Z';
}

// Convert geometry to SVG path data
function geometryToPath(geometry: GeoFeature['geometry']): string {
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates as number[][][];
    return coords.map(ringToPath).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates as number[][][][];
    return coords.map(poly => poly.map(ringToPath).join(' ')).join(' ');
  }
  return '';
}

export function RainHeatmap() {
  const [data, setData] = useState<RegionRain[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState<GeoFeature[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Load GeoJSON
  useEffect(() => {
    fetch('/data/ph-regions.json')
      .then(res => res.json())
      .then(json => setGeoData(json.features || []))
      .catch(() => setGeoData([]));
  }, []);

  // Fetch rain data
  useEffect(() => {
    let cancelled = false;

    async function fetchAllRegions() {
      setLoading(true);
      const entries = Object.entries(REGION_COORDS);
      const results: RegionRain[] = [];

      for (let i = 0; i < entries.length; i += 4) {
        const batch = entries.slice(i, i + 4);
        const promises = batch.map(async ([region, coords]) => {
          try {
            const forecast = await requestForecast(coords);
            const day = forecast.daily.find(d => d.date === manilaDate());
            return { region, rainMm: day?.total_rain ?? null, probability: day?.avg_prob ?? null };
          } catch {
            return { region, rainMm: null, probability: null };
          }
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        if (i + 4 < entries.length) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      if (!cancelled) {
        setData(results);
        setLoading(false);
      }
    }

    fetchAllRegions();
    return () => { cancelled = true; };
  }, []);

  // Map region rain data by name for quick lookup
  const rainByRegion = useMemo(() => {
    const map = new Map<string, RegionRain>();
    data.forEach(d => map.set(d.region, d));
    return map;
  }, [data]);

  if (loading) {
    return (
      <div className="rain-heatmap">
        <div className="heatmap-loading">
          <div className="spinner-small" />
          <span>Loading rain data for all regions...</span>
        </div>
      </div>
    );
  }

  const hoveredData = hoveredRegion ? rainByRegion.get(hoveredRegion) : null;

  return (
    <div className="rain-heatmap">
      <p>Gray regions: data unavailable. Point forecasts represent selected regional reference locations, not uniform conditions across a region.</p>
      {/* GeoJSON Map */}
      <div className="heatmap-map">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="heatmap-svg">
          {/* Background */}
          <rect width={SVG_W} height={SVG_H} fill="transparent" />

          {/* Region shapes */}
          {geoData.map((feature) => {
            const geoName = feature.properties.REGION;
            const regionKey = REGION_NAME_MAP[geoName] || geoName;
            const regionRain = rainByRegion.get(regionKey);
            const rainMm = regionRain?.rainMm ?? null;
            const pathData = geometryToPath(feature.geometry);
            const isHovered = hoveredRegion === regionKey;

            return (
              <path
                key={geoName}
                d={pathData}
                fill={rainMm === null ? 'var(--border)' : getRainFill(rainMm)}
                stroke={isHovered && rainMm !== null ? getRainColor(rainMm) : 'rgba(255,255,255,0.25)'}
                strokeWidth={isHovered ? 1.5 : 0.5}
                className="heatmap-region-path"
                tabIndex={0}
                aria-label={`${regionKey}: ${rainMm === null ? 'data unavailable' : `${rainMm} mm forecast rain`}`}
                onFocus={() => setHoveredRegion(regionKey)}
                onMouseEnter={() => setHoveredRegion(regionKey)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
            );
          })}

          {/* Rain amount labels */}
          {data.map((d) => {
            const coords = REGION_COORDS[d.region];
            if (!coords || d.rainMm === null || d.rainMm === 0) return null;
            const x = projectX(coords.lon);
            const y = projectY(coords.lat);
            return (
              <g key={d.region + '-label'}>
                <circle cx={x} cy={y} r={10} fill={getRainColor(d.rainMm ?? 0)} opacity={0.85} />
                <text x={x} y={y + 3} textAnchor="middle" fontSize="6.5" fill="#fff" fontWeight="700">
                  {d.rainMm.toFixed(0)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredData && (
          <div className="heatmap-tooltip">
            <strong>{hoveredData.region}</strong>
            <span>{hoveredData.rainMm === null ? 'Data unavailable' : `${hoveredData.rainMm}mm · ${hoveredData.probability}% mean hourly probability`}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="legend-title">Rain (mm today)</span>
        <div className="legend-scale">
          <div className="legend-item"><span className="legend-dot" style={{ background: '#a8e6cf' }} />0-1</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#ffd93d' }} />5-10</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#ff9f43' }} />10-20</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#ee5a24' }} />20-40</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#c0392b' }} />40+</div>
        </div>
      </div>

      {/* Top regions list */}
      <div className="heatmap-list">
        {[...data].sort((a, b) => (b.rainMm ?? -1) - (a.rainMm ?? -1)).slice(0, 5).map((d) => (
          <div key={d.region} className="heatmap-row">
            <DropletIcon size={12} color={getRainColor(d.rainMm ?? 0)} />
            <span className="heatmap-region">{d.region}</span>
            <span className="heatmap-val">{d.rainMm === null ? 'Unavailable' : `${d.rainMm}mm`}</span>
            <span className="heatmap-prob">{d.probability}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
