import './SkeletonLoader.css';

/**
 * Cinematic loading state — replaces generic spinner with
 * skeleton cards that match the actual dashboard layout.
 */
export function SkeletonLoader() {
  return (
    <div className="skeleton-dashboard" aria-label="Loading weather data" role="status">
      {/* Cinematic orb loader */}
      <div className="cinematic-loader">
        <div className="loader-orb">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
          <div className="core" />
        </div>
        <p className="loader-text">Fetching forecast</p>
        <p className="loader-subtext">Connecting to Open-Meteo</p>
      </div>

      {/* Skeleton cards mimicking actual content */}
      <div className="skeleton-card">
        <div className="skeleton-title" />
        <div className="skeleton-days">
          <div className="skeleton-day" />
          <div className="skeleton-day" />
          <div className="skeleton-day" />
          <div className="skeleton-day" />
          <div className="skeleton-day" />
        </div>
      </div>

      <div className="skeleton-card">
        <div className="skeleton-title" />
        <div className="skeleton-timeline">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton-hour">
              <div className="skeleton-line short" style={{ width: '28px', height: '8px' }} />
              <div className="skeleton-hour-bar" style={{ height: `${20 + Math.sin(i) * 15}px` }} />
              <div className="skeleton-line short" style={{ width: '20px', height: '8px' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="skeleton-card">
        <div className="skeleton-title" />
        <div className="skeleton-chart" />
      </div>
    </div>
  );
}
