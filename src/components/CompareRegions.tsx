import { useState } from 'react';
import { CloudRainIcon, ThermometerIcon, DropletIcon, WindIcon, CheckCircleIcon, HandshakeIcon } from './Icons';
import { REGIONS, getRegionNumber } from '../utils/regions';
import { REGION_CITIES } from '../utils/cities';
import { getCached, setCache } from '../hooks/useWeatherCache';
import './CompareRegions.css';

interface LocationStats {
  label: string;
  avg_prob: number;
  total_rain: number;
  avg_temp: number;
  avg_wind: number;
}

interface Props {
  date: string;
  onClose: () => void;
}

async function fetchLocationDay(lat: number, lon: number, label: string, date: string): Promise<LocationStats | null> {
  const cacheKey = `compare-${lat}-${lon}-${date}`;
  const cached = getCached<LocationStats>(cacheKey);
  if (cached) return { ...cached, label };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m&timezone=Asia/Manila&start_date=${date}&end_date=${date}`;

    // Retry on 429
    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url);
      if (response.ok) break;
      if (response.status === 429 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
        continue;
      }
    }
    if (!response || !response.ok) return null;

    const data = await response.json();
    const probs: number[] = data.hourly.precipitation_probability;
    const rains: number[] = data.hourly.precipitation;
    const temps: number[] = data.hourly.temperature_2m;
    const winds: number[] = data.hourly.wind_speed_10m;
    const stats: LocationStats = {
      label,
      avg_prob: Math.round(probs.reduce((a, b) => a + b, 0) / probs.length),
      total_rain: Math.round(rains.reduce((a, b) => a + b, 0) * 10) / 10,
      avg_temp: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10,
      avg_wind: Math.round((winds.reduce((a, b) => a + b, 0) / winds.length) * 10) / 10,
    };
    setCache(cacheKey, stats);
    return stats;
  } catch {
    return null;
  }
}

export function CompareRegions({ date, onClose }: Props) {
  // Location A
  const [regionA, setRegionA] = useState('NCR');
  const [cityA, setCityA] = useState('');
  // Location B
  const [regionB, setRegionB] = useState('Bicol');
  const [cityB, setCityB] = useState('');

  const [statsA, setStatsA] = useState<LocationStats | null>(null);
  const [statsB, setStatsB] = useState<LocationStats | null>(null);
  const [loading, setLoading] = useState(false);

  const citiesA = REGION_CITIES[regionA] || [];
  const citiesB = REGION_CITIES[regionB] || [];

  function getCoords(region: string, city: string): { lat: number; lon: number } | null {
    if (city) {
      const cities = REGION_CITIES[region] || [];
      const found = cities.find((c) => c.name === city);
      return found || null;
    }
    const cities = REGION_CITIES[region];
    return cities && cities.length > 0 ? cities[0] : null;
  }

  function handleCompare() {
    const coordsA = getCoords(regionA, cityA);
    const coordsB = getCoords(regionB, cityB);
    if (!coordsA || !coordsB) return;

    const labelA = cityA || `${getRegionNumber(regionA)} (center)`;
    const labelB = cityB || `${getRegionNumber(regionB)} (center)`;

    setLoading(true);
    Promise.all([
      fetchLocationDay(coordsA.lat, coordsA.lon, labelA, date),
      fetchLocationDay(coordsB.lat, coordsB.lon, labelB, date),
    ]).then(([a, b]) => {
      setStatsA(a);
      setStatsB(b);
      setLoading(false);
    });
  }

  return (
    <div className="compare-container">
      <div className="compare-header">
        <h3>Compare Locations</h3>
        <button className="compare-close" onClick={onClose} aria-label="Close comparison">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Selectors */}
      <div className="compare-selectors">
        <div className="compare-location-pick">
          <span className="compare-pick-label">Location A</span>
          <select value={regionA} onChange={(e) => { setRegionA(e.target.value); setCityA(''); }} className="compare-select" aria-label="Region A">
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.number} - {r.id}</option>
            ))}
          </select>
          <select value={cityA} onChange={(e) => setCityA(e.target.value)} className="compare-select" aria-label="City A">
            <option value="">Entire Region</option>
            {citiesA.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <span className="compare-vs">vs</span>

        <div className="compare-location-pick">
          <span className="compare-pick-label">Location B</span>
          <select value={regionB} onChange={(e) => { setRegionB(e.target.value); setCityB(''); }} className="compare-select" aria-label="Region B">
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.number} - {r.id}</option>
            ))}
          </select>
          <select value={cityB} onChange={(e) => setCityB(e.target.value)} className="compare-select" aria-label="City B">
            <option value="">Entire Region</option>
            {citiesB.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button className="compare-go-btn" onClick={handleCompare} disabled={loading}>
        {loading ? 'Comparing...' : 'Compare'}
      </button>

      {/* Results */}
      {loading && <p className="compare-loading">Fetching weather data...</p>}

      {!loading && statsA && statsB && (
        <>
          <div className="compare-verdict">
            {statsA.avg_prob === statsB.avg_prob ? (
              <span className="verdict-text tie"><HandshakeIcon size={16} color="var(--text-muted)" /> Similar conditions</span>
            ) : (
              <span className="verdict-text">
                <CheckCircleIcon size={16} color="var(--success)" />{' '}
                <strong>{statsA.avg_prob < statsB.avg_prob ? statsA.label : statsB.label}</strong> is the better destination - {Math.min(statsA.avg_prob, statsB.avg_prob)}% vs {Math.max(statsA.avg_prob, statsB.avg_prob)}% rain chance
              </span>
            )}
          </div>

          <div className="compare-table">
            <div className="compare-row header">
              <span className="compare-metric"></span>
              <span className="compare-val region-name">{statsA.label}</span>
              <span className="compare-val region-name">{statsB.label}</span>
            </div>
            <CompareRow icon={<CloudRainIcon size={16} color="#1976d2" />} label="Rain chance" valA={`${statsA.avg_prob}%`} valB={`${statsB.avg_prob}%`} betterA={statsA.avg_prob < statsB.avg_prob} betterB={statsB.avg_prob < statsA.avg_prob} />
            <CompareRow icon={<DropletIcon size={16} color="#1565c0" />} label="Total rain" valA={`${statsA.total_rain}mm`} valB={`${statsB.total_rain}mm`} betterA={statsA.total_rain < statsB.total_rain} betterB={statsB.total_rain < statsA.total_rain} />
            <CompareRow icon={<ThermometerIcon size={16} color="#e65100" />} label="Temp" valA={`${statsA.avg_temp}\u00B0C`} valB={`${statsB.avg_temp}\u00B0C`} betterA={false} betterB={false} />
            <CompareRow icon={<WindIcon size={16} color="#546e7a" />} label="Wind" valA={`${statsA.avg_wind}km/h`} valB={`${statsB.avg_wind}km/h`} betterA={statsA.avg_wind < statsB.avg_wind} betterB={statsB.avg_wind < statsA.avg_wind} />
          </div>
        </>
      )}
    </div>
  );
}

function CompareRow({ icon, label, valA, valB, betterA, betterB }: {
  icon: React.ReactNode; label: string; valA: string; valB: string; betterA: boolean; betterB: boolean;
}) {
  return (
    <div className="compare-row">
      <span className="compare-metric">{icon}<span>{label}</span></span>
      <span className={`compare-val ${betterA ? 'better' : ''}`}>{valA}</span>
      <span className={`compare-val ${betterB ? 'better' : ''}`}>{valB}</span>
    </div>
  );
}
