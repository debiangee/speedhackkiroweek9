import { useState } from 'react';
import { AlertCircleIcon, XIcon } from './Icons';
import './TyphoonBanner.css';

export function TyphoonBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="typhoon-banner" role="note">
      <div className="typhoon-icon">
        <AlertCircleIcon size={20} color="#e65100" />
      </div>
      <div className="typhoon-content">
        <strong>Weather preparedness</strong>
        <p>
          This is general preparedness information, not an active storm warning. Monitor PAGASA advisories
          and prepare emergency kits. Regions in Eastern Visayas, Bicol, and Cagayan Valley
          are most affected.
        </p>
      </div>
      <button
        className="typhoon-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss preparedness information"
      >
        <XIcon size={16} color="#9ca3af" />
      </button>
    </div>
  );
}
