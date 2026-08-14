import { useEvacuationCenters, EvacuationCenter } from '../hooks/useEvacuationCenters';
import './EvacuationPanel.css';

interface EvacuationPanelProps {
  lat: number | null;
  lon: number | null;
  region: string;
}

const TYPE_LABELS: Record<EvacuationCenter['type'], string> = {
  shelter: 'Shelter',
  assembly_point: 'Assembly Point',
  community_center: 'Community Center',
  civic: 'Civic',
};

export default function EvacuationPanel({ lat, lon, region }: EvacuationPanelProps) {
  const { loading, error, centers, searchRadius } = useEvacuationCenters(lat, lon);

  const displayCenters = centers.slice(0, 10);

  return (
    <section className="evacuation-panel" aria-label="Evacuation Centers">
      <header className="evacuation-header">
        <span className="evacuation-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
        <div className="evacuation-header-text">
          <h3 className="evacuation-title">Evacuation Centers</h3>
          <p className="evacuation-subtitle">
            Within {searchRadius}km of your location
            {region && <span className="evacuation-region"> — {region}</span>}
          </p>
        </div>
      </header>

      {loading && <EvacuationSkeleton />}

      {error && (
        <div className="evacuation-error" role="alert">
          <span className="evacuation-error-icon material-symbols-rounded" aria-hidden="true">warning</span>
          <p className="evacuation-error-text">
            Unable to load evacuation centers. {error}
          </p>
        </div>
      )}

      {!loading && !error && displayCenters.length === 0 && (
        <div className="evacuation-empty">
          <span className="evacuation-empty-icon material-symbols-rounded" aria-hidden="true">location_on</span>
          <p className="evacuation-empty-text">No evacuation centers found nearby.</p>
        </div>
      )}

      {!loading && !error && displayCenters.length > 0 && (
        <ul className="evacuation-list" aria-label="List of evacuation centers">
          {displayCenters.map((center, index) => (
            <li
              key={center.id}
              className="evacuation-card"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="evacuation-card-icon" aria-hidden="true">
                <CenterIcon type={center.type} />
              </span>
              <div className="evacuation-card-content">
                <h4 className="evacuation-card-name">{center.name}</h4>
                <span className={`evacuation-type-badge evacuation-type-${center.type}`}>
                  {TYPE_LABELS[center.type]}
                </span>
                {center.address && (
                  <p className="evacuation-card-address">{center.address}</p>
                )}
              </div>
              <div className="evacuation-card-meta">
                <span className="evacuation-distance">{center.distance.toFixed(1)} km away</span>
                <a
                  className="evacuation-directions-btn"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Get directions to ${center.name}`}
                >
                  Directions
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EvacuationSkeleton() {
  return (
    <div className="evacuation-skeleton" aria-label="Loading evacuation centers">
      {[0, 1, 2].map((i) => (
        <div key={i} className="evacuation-skeleton-card" aria-hidden="true">
          <div className="evacuation-skeleton-icon" />
          <div className="evacuation-skeleton-content">
            <div className="evacuation-skeleton-line wide" />
            <div className="evacuation-skeleton-line narrow" />
          </div>
          <div className="evacuation-skeleton-badge" />
        </div>
      ))}
    </div>
  );
}

function CenterIcon({ type }: { type: EvacuationCenter['type'] }) {
  switch (type) {
    case 'shelter':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'assembly_point':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'community_center':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="12" y1="6" x2="12" y2="6.01" />
          <line x1="12" y1="10" x2="12" y2="10.01" />
          <line x1="12" y1="14" x2="12" y2="14.01" />
          <line x1="12" y1="18" x2="12" y2="18.01" />
        </svg>
      );
    case 'civic':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <path d="M2 20h20" />
          <path d="M12 4l-6 6h12l-6-6z" />
        </svg>
      );
  }
}
