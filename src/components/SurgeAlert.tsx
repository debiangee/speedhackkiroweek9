import { useState, useEffect } from 'react';
import type { SurgeResult } from '../utils/surge-engine';
import { formatHour } from '../utils/surge-engine';
import { CheckCircleIcon, ZapIcon, ClockIcon } from './Icons';
import './SurgeAlert.css';

interface Props {
  results: SurgeResult[];
  currentHour: number;
}

type AlertState = 'calm' | 'pre_surge' | 'active';

export function SurgeAlert({ results, currentHour }: Props) {
  const [_now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentIdx = results.findIndex((r) => r.hour === currentHour);
  if (currentIdx === -1 || results.length === 0) return null;

  const currentResult = results[currentIdx];

  let alertState: AlertState = 'calm';
  let surgeHour = -1;
  let surgeEndHour = -1;

  if (currentResult.score >= 50) {
    alertState = 'active';
    for (let i = currentIdx + 1; i < results.length; i++) {
      if (results[i].score < 50) {
        surgeEndHour = results[i].hour;
        break;
      }
    }
  } else {
    for (let i = currentIdx + 1; i < Math.min(currentIdx + 4, results.length); i++) {
      if (results[i].score >= 50) {
        alertState = 'pre_surge';
        surgeHour = results[i].hour;
        break;
      }
    }
  }

  const minutesUntilSurge = surgeHour > currentHour ? (surgeHour - currentHour) * 60 : 0;
  const minutesUntilEnd = surgeEndHour > currentHour ? (surgeEndHour - currentHour) * 60 : 0;

  if (alertState === 'calm') {
    return (
      <div className="surge-alert calm" role="status">
        <div className="alert-icon-wrapper" aria-hidden="true">
          <CheckCircleIcon size={18} color="#16a34a" />
        </div>
        <div className="alert-content">
          <div className="alert-heading">Standard Fares Active</div>
          <div className="alert-text">No transport surge expected soon. Optimal time to book Grab, Angkas, or commute.</div>
        </div>
      </div>
    );
  }

  if (alertState === 'pre_surge') {
    const leaveBy = surgeHour > 0 ? surgeHour - 1 : 0;
    return (
      <div className="surge-alert pre-surge" role="alert">
        <div className="alert-icon-wrapper" aria-hidden="true">
          <ClockIcon size={18} color="#d97706" />
        </div>
        <div className="alert-content">
          <div className="alert-heading-row">
            <span className="alert-heading">Pre-Surge Warning</span>
            {minutesUntilSurge > 0 && (
              <span className="alert-countdown">In ~{minutesUntilSurge} mins</span>
            )}
          </div>
          <div className="alert-text">
            Surge pricing predicted to start at <strong>{formatHour(surgeHour)}</strong>. Depart by <strong>{formatHour(leaveBy)}</strong> to avoid peak pricing.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surge-alert active" role="alert">
      <div className="alert-icon-wrapper" aria-hidden="true">
        <ZapIcon size={18} color="#dc2626" />
      </div>
      <div className="alert-content">
        <div className="alert-heading-row">
          <span className="alert-heading">Surge Pricing In Effect</span>
          {surgeEndHour > 0 && minutesUntilEnd > 0 && (
            <span className="alert-countdown active-countdown">Easing in ~{minutesUntilEnd} mins</span>
          )}
        </div>
        <div className="alert-text">
          High demand and weather conditions are driving elevated fares.
          {surgeEndHour > 0
            ? ` Fares expected to normalize around ${formatHour(surgeEndHour)}.`
            : ' Consider waiting or switching to rail/jeepney routes.'}
        </div>
      </div>
    </div>
  );
}
