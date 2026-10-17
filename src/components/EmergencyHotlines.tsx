import { useState } from 'react';
import { getHotlinesForRegion, getHotlineTypeLabel, type Hotline } from '../utils/emergency-hotlines';
import { getRegionLabel } from '../utils/regions';
import {
  MapPinIcon,
  FlagIcon,
  ShieldAlertIcon,
  PoliceIcon,
  FlameIcon,
  MedicalIcon,
  AmbulanceIcon,
  PhoneCallIcon,
} from './Icons';
import './EmergencyHotlines.css';

interface Props {
  region: string;
}

function renderHotlineTypeIcon(type: Hotline['type']) {
  switch (type) {
    case 'disaster':
      return <ShieldAlertIcon size={12} color="currentColor" />;
    case 'police':
      return <PoliceIcon size={12} color="currentColor" />;
    case 'fire':
      return <FlameIcon size={12} color="currentColor" />;
    case 'medical':
      return <MedicalIcon size={12} color="currentColor" />;
    case 'rescue':
      return <AmbulanceIcon size={12} color="currentColor" />;
    case 'general':
      return <PhoneCallIcon size={12} color="currentColor" />;
  }
}

function HotlineCard({ hotline }: { hotline: Hotline }) {
  return (
    <a
      href={`tel:${hotline.number.replace(/[() -]/g, '')}`}
      className={`hotline-card hotline-${hotline.type}`}
      aria-label={`Call ${hotline.name} at ${hotline.number}`}
    >
      <div className="hotline-info">
        <span className="hotline-name">{hotline.name}</span>
        <span className="hotline-type-badge">
          <span className="hotline-badge-icon" aria-hidden="true">{renderHotlineTypeIcon(hotline.type)}</span>
          {getHotlineTypeLabel(hotline.type)}
        </span>
      </div>
      <span className="hotline-number">{hotline.number}</span>
      <span className="hotline-tap-hint">Tap to call</span>
    </a>
  );
}

export function EmergencyHotlines({ region }: Props) {
  const [showNational, setShowNational] = useState(false);
  const { regional, national } = getHotlinesForRegion(region);

  return (
    <div className="emergency-hotlines">
      {/* Regional hotlines — most relevant */}
      {regional && (
        <div className="hotlines-section">
          <h4 className="hotlines-section-title">
            <MapPinIcon size={16} color="var(--accent)" />
            <span>Near You — {getRegionLabel(region)}</span>
          </h4>
          <p className="hotlines-source">Office of Civil Defense – {regional.label}</p>
          <div className="hotlines-grid" role="group" aria-label={`Emergency hotlines for ${regional.label}`}>
            {regional.hotlines.map((h, i) => (
              <HotlineCard key={i} hotline={h} />
            ))}
          </div>
        </div>
      )}

      {!regional && (
        <p className="hotlines-fallback">
          No specific regional hotline data available. Use national hotlines below.
        </p>
      )}

      {/* National hotlines toggle */}
      <button
        className="hotlines-national-toggle"
        onClick={() => setShowNational(!showNational)}
        aria-expanded={showNational}
      >
        {showNational ? 'Hide' : 'Show'} National Hotlines ({national.length})
      </button>

      {showNational && (
        <div className="hotlines-section hotlines-national">
          <h4 className="hotlines-section-title">
            <FlagIcon size={16} color="var(--accent)" />
            <span>National Emergency Numbers</span>
          </h4>
          <div className="hotlines-grid" role="group" aria-label="National emergency hotlines">
            {national.map((h, i) => (
              <HotlineCard key={i} hotline={h} />
            ))}
          </div>
          <p className="hotlines-disclaimer">
            For official storm advisories, always check{' '}
            <a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noopener noreferrer">PAGASA</a>{' '}
            and{' '}
            <a href="https://ndrrmc.gov.ph/" target="_blank" rel="noopener noreferrer">NDRRMC</a>.
            {' '}Numbers sourced from{' '}
            <a href="https://ehotlines.e.gov.ph/" target="_blank" rel="noopener noreferrer">ehotlines.e.gov.ph</a>.
          </p>
        </div>
      )}
    </div>
  );
}
