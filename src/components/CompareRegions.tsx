import { useState, useEffect, useRef } from 'react';
import { CloudRainIcon, ThermometerIcon, DropletIcon, WindIcon, CheckCircleIcon, HandshakeIcon } from './Icons';
import { REGIONS, getRegionNumber } from '../utils/regions';
import { REGION_CITIES } from '../utils/cities';
import { requestForecast } from '../services/forecast-provider';
import { resolveLocation } from '../utils/locations';
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
  try {
    const result = await requestForecast({ lat, lon });
    const day = result.daily.find(d => d.date === date);
    if (!day) return null;
    return { label, avg_prob: day.avg_prob, total_rain: day.total_rain, avg_temp: day.avg_temp, avg_wind: day.avg_wind };
  } catch { return null; }
}

export function CompareRegions({ date, onClose }: Props) {
  const requestId = useRef(0);
  // Location A
  const [regionA, setRegionA] = useState('NCR');
  const [cityA, setCityA] = useState('');
  // Location B
  const [regionB, setRegionB] = useState('Bicol');
  const [cityB, setCityB] = useState('');

  const [statsA, setStatsA] = useState<LocationStats | null>(null);
  const [statsB, setStatsB] = useState<LocationStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { requestId.current++; setStatsA(null); setStatsB(null); setLoading(false); setError(null); }, [regionA, cityA, regionB, cityB, date]);
  const citiesA = REGION_CITIES[regionA] || [];
  const citiesB = REGION_CITIES[regionB] || [];

  function getCoords(region: string, city: string): { lat: number; lon: number } | null {
    return resolveLocation(region, city || null);
  }

  function handleCompare() {
    const coordsA = getCoords(regionA, cityA);
    const coordsB = getCoords(regionB, cityB);
    if (!coordsA || !coordsB) return;

    const labelA = cityA || `${getRegionNumber(regionA)} (center)`;
    const labelB = cityB || `${getRegionNumber(regionB)} (center)`;

    const request = ++requestId.current;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchLocationDay(coordsA.lat, coordsA.lon, labelA, date),
      fetchLocationDay(coordsB.lat, coordsB.lon, labelB, date),
    ]).then(([a, b]) => {
      if (request !== requestId.current) return;
      if (!a || !b) setError('Comparison unavailable for one or both locations. Try again.');
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
            <option value="">Regional reference point</option>
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
            <option value="">Regional reference point</option>
            {citiesB.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button className="compare-go-btn" onClick={handleCompare} disabled={loading}>
        {loading ? 'Comparing...' : 'Compare'}
      </button>

      {error && <p role="alert">{error}</p>}
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
                <strong>{statsA.avg_prob < statsB.avg_prob ? statsA.label : statsB.label}</strong> has a lower average hourly rain probability - {Math.min(statsA.avg_prob, statsB.avg_prob)}% vs {Math.max(statsA.avg_prob, statsB.avg_prob)}% mean hourly probability
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
