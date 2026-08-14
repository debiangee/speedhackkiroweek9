import { useState, useEffect } from 'react';
import type { SurgeResult } from '../utils/surge-engine';
import { formatHour } from '../utils/surge-engine';
import './SurgeAlert.css';

interface Props {
  results: SurgeResult[];
  currentHour: number;
}

type AlertState = 'calm' | 'pre_surge' | 'active';

export function SurgeAlert({ results, currentHour }: Props) {
  const [_now, setNow] = useState(Date.now());

  // Update every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentIdx = results.findIndex((r) => r.hour === currentHour);
  if (currentIdx === -1 || results.length === 0) return null;

  const currentResult = results[currentIdx];

  // Determine alert state
  let alertState: AlertState = 'calm';
  let surgeHour = -1;
  let surgeEndHour = -1;

  if (currentResult.score >= 50) {
    alertState = 'active';
    // Find when it drops below 50
    for (let i = currentIdx + 1; i < results.length; i++) {
      if (results[i].score < 50) {
        surgeEndHour = results[i].hour;
        break;
      }
    }
  } else {
    // Check next 3 hours for transition above 50
    for (let i = currentIdx + 1; i < Math.min(currentIdx + 4, results.length); i++) {
      if (results[i].score >= 50) {
        alertState = 'pre_surge';
        surgeHour = results[i].hour;
        break;
      }
    }
  }

  // Countdown computation
  const minutesUntilSurge = surgeHour > currentHour ? (surgeHour - currentHour) * 60 : 0;
  const minutesUntilEnd = surgeEndHour > currentHour ? (surgeEndHour - currentHour) * 60 : 0;

  if (alertState === 'calm') {
    return (
      <div className="surge-alert calm" role="status">
        <span className="alert-dot green" />
        <span className="alert-text">No surge expected soon. Good time to book.</span>
      </div>
    );
  }

  if (alertState === 'pre_surge') {
    const leaveBy = surgeHour > 0 ? surgeHour - 1 : 0;
    return (
      <div className="surge-alert pre-surge" role="alert">
        <span className="alert-dot amber pulse" />
        <div className="alert-content">
          <span className="alert-text">
            Surge predicted at <strong>{formatHour(surgeHour)}</strong>. Leave by <strong>{formatHour(leaveBy)}</strong> to avoid peak pricing.
          </span>
          {minutesUntilSurge > 0 && (
            <span className="alert-countdown">{minutesUntilSurge} min until surge</span>
          )}
        </div>
      </div>
    );
  }

  // Active surge
  return (
    <div className="surge-alert active" role="alert">
      <span className="alert-dot red pulse" />
      <div className="alert-content">
        <span className="alert-text">
          <strong>Surge active.</strong>
          {surgeEndHour > 0
            ? ` Expected to drop by ${formatHour(surgeEndHour)} (~${minutesUntilEnd} min).`
            : ' Duration uncertain — check back soon.'}
        </span>
      </div>
    </div>
  );
}
