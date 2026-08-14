import { useState, useEffect } from 'react';
import { DropletIcon } from './Icons';
import './RainHeatmap.css';

// Region center coordinates — slightly adjusted to reduce bubble overlap on the map
const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'NCR': { lat: 14.5995, lon: 121.0 },
  'CAR': { lat: 16.8, lon: 120.5 },
  'Ilocos': { lat: 17.8, lon: 119.8 },
  'Cagayan Valley': { lat: 17.8, lon: 121.7 },
  'Central Luzon': { lat: 15.5, lon: 120.3 },
  'CALABARZON': { lat: 14.0, lon: 121.6 },
  'MIMAROPA': { lat: 12.0, lon: 118.7 },
  'Bicol': { lat: 13.2, lon: 123.7 },
  'Western Visayas': { lat: 10.7, lon: 122.2 },
  'Central Visayas': { lat: 10.0, lon: 123.9 },
  'Eastern Visayas': { lat: 11.25, lon: 125.2 },
  'Zamboanga Peninsula': { lat: 7.5, lon: 121.5 },
  'Northern Mindanao': { lat: 8.5, lon: 124.2 },
  'Davao': { lat: 7.0, lon: 125.8 },
  'SOCCSKSARGEN': { lat: 6.2, lon: 124.5 },
  'Caraga': { lat: 9.2, lon: 125.8 },
  'BARMM': { lat: 7.0, lon: 123.0 },
};

interface RegionRain {
  region: string;
  rainMm: number;
  probability: number;
}

// Color based on rain intensity
function getRainColor(rainMm: number): string {
  if (rainMm <= 1) return '#a8e6cf';    // Dry - green
  if (rainMm <= 5) return '#88d8b0';    // Light
  if (rainMm <= 10) return '#ffd93d';   // Moderate - yellow
  if (rainMm <= 20) return '#ff9f43';   // Heavy - orange
  if (rainMm <= 40) return '#ee5a24';   // Very heavy - red-orange
  return '#c0392b';                      // Extreme - red
}

// Simple projection — adjusted for proper PH map proportions
const MAP_BOUNDS = { minLon: 117, maxLon: 127, minLat: 5, maxLat: 20 };
const SVG_W = 280;
const SVG_H = 400;

function px(lon: number) { return 20 + ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * (SVG_W - 40); }
function py(lat: number) { return 20 + ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * (SVG_H - 40); }

export function RainHeatmap() {
  const [data, setData] = useState<RegionRain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAllRegions() {
      setLoading(true);

      // Fetch today's rain for all regions in parallel (batched)
      const entries = Object.entries(REGION_COORDS);
      const results: RegionRain[] = [];

      // Batch in groups of 4 to avoid rate limits
      for (let i = 0; i < entries.length; i += 4) {
        const batch = entries.slice(i, i + 4);
        const promises = batch.map(async ([region, coords]) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=precipitation,precipitation_probability&timezone=Asia/Manila&forecast_days=1`;
            const res = await fetch(url);
            if (!res.ok) return { region, rainMm: 0, probability: 0 };
            const json = await res.json();
            const totalRain = (json.hourly?.precipitation || []).reduce((s: number, v: number) => s + (v || 0), 0);
            const avgProb = (json.hourly?.precipitation_probability || []).reduce((s: number, v: number) => s + (v || 0), 0) / 24;
            return { region, rainMm: Math.round(totalRain * 10) / 10, probability: Math.round(avgProb) };
          } catch {
            return { region, rainMm: 0, probability: 0 };
          }
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        // Small delay between batches
        if (i + 4 < entries.length) {
          await new Promise((r) => setTimeout(r, 500));
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

  const maxRain = Math.max(...data.map((d) => d.rainMm), 1);

  return (
    <div className="rain-heatmap">
      <div className="heatmap-map">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="heatmap-svg">
          <rect width={SVG_W} height={SVG_H} fill="transparent" rx="8" />
          {data.map((d) => {
            const coords = REGION_COORDS[d.region];
            if (!coords) return null;
            const x = px(coords.lon);
            const y = py(coords.lat);
            const radius = 8 + (d.rainMm / maxRain) * 8;
            return (
              <g key={d.region}>
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={getRainColor(d.rainMm)}
                  opacity={0.7}
                  stroke={getRainColor(d.rainMm)}
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="7"
                  fill="var(--text-primary)"
                  fontWeight="600"
                >
                  {d.rainMm > 0 ? d.rainMm.toFixed(0) : '0'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

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

      <div className="heatmap-list">
        {[...data].sort((a, b) => b.rainMm - a.rainMm).slice(0, 5).map((d) => (
          <div key={d.region} className="heatmap-row">
            <DropletIcon size={12} color={getRainColor(d.rainMm)} />
            <span className="heatmap-region">{d.region}</span>
            <span className="heatmap-val">{d.rainMm}mm</span>
            <span className="heatmap-prob">{d.probability}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
