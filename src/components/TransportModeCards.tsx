import type { TransportImpact } from '../utils/surge-engine';
import './TransportModeCards.css';

interface Props {
  impacts: TransportImpact[];
}

const MODE_ICONS: Record<string, string> = {
  grab: '🚗',
  angkas: '🏍️',
  jeepney: '🚌',
  walking: '🚶',
};

export function TransportModeCards({ impacts }: Props) {
  return (
    <div className="transport-modes" role="list" aria-label="Transport mode impacts">
      {impacts.map((impact) => (
        <div
          key={impact.mode}
          className={`transport-card severity-${impact.severity}`}
          role="listitem"
          aria-label={`${impact.label}: ${impact.status}`}
        >
          <div className="tc-icon">{MODE_ICONS[impact.mode]}</div>
          <div className="tc-info">
            <span className="tc-name">{impact.label}</span>
            <strong className="tc-status">{impact.status}</strong>
            <span className="tc-tip">{impact.tip}</span>
          </div>
          <div className={`tc-severity-bar severity-bar-${impact.severity}`} />
        </div>
      ))}
    </div>
  );
}
