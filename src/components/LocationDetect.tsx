import { NavigationIcon } from './Icons';
import './LocationDetect.css';

interface Props {
  detecting: boolean;
  onDetect: () => void;
  error: string | null;
}

export function LocationDetect({ detecting, onDetect, error }: Props) {
  return (
    <div className="location-detect">
      <button
        className="detect-btn"
        onClick={onDetect}
        disabled={detecting}
        aria-label="Detect my current location"
      >
        {detecting ? (
          <span className="detect-spinner" aria-hidden="true" />
        ) : (
          <NavigationIcon size={16} color="currentColor" />
        )}
        <span>{detecting ? 'Detecting...' : 'Use my location'}</span>
      </button>
      {error && <span className="detect-error" role="alert">{error}</span>}
    </div>
  );
}
