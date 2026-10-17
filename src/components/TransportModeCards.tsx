import type { TransportImpact } from '../utils/surge-engine';
import { CarIcon, MotorcycleIcon, BusIcon, WalkingIcon } from './Icons';
import './TransportModeCards.css';

interface Props {
  impacts: TransportImpact[];
}

function renderModeIcon(mode: string) {
  switch (mode) {
    case 'grab':
      return <CarIcon size={20} color="currentColor" />;
    case 'angkas':
      return <MotorcycleIcon size={20} color="currentColor" />;
    case 'jeepney':
      return <BusIcon size={20} color="currentColor" />;
    case 'walking':
      return <WalkingIcon size={20} color="currentColor" />;
    default:
      return <CarIcon size={20} color="currentColor" />;
  }
}

function getProviderFullName(mode: string): string {
  switch (mode) {
    case 'grab':
      return 'Grab / 4-Wheeled Taxi';
    case 'angkas':
      return 'Angkas / Motorcycle Taxi';
    case 'jeepney':
      return 'Jeepney & Commuter Bus';
    case 'walking':
      return 'Walking & Cycling';
    default:
      return mode;
  }
}

function getSeverityBadge(severity: TransportImpact['severity']): { text: string; className: string } {
  switch (severity) {
    case 'good':
      return { text: 'Planning context', className: 'badge-good' };
    case 'moderate':
      return { text: 'Moderate Demand', className: 'badge-moderate' };
    case 'poor':
      return { text: 'High Surge / Slower', className: 'badge-poor' };
    case 'severe':
      return { text: 'Severe Surge / Risk', className: 'badge-severe' };
    default:
      return { text: 'Normal', className: 'badge-good' };
  }
}

export function TransportModeCards({ impacts }: Props) {
  return (
    <div className="transport-modes" role="list" aria-label="Transport planning context">
      {impacts.map((impact) => {
        const badge = getSeverityBadge(impact.severity);
        return (
          <div
            key={impact.mode}
            className={`transport-card severity-${impact.severity}`}
            role="listitem"
            aria-label={`${getProviderFullName(impact.mode)}: ${impact.status}. ${impact.tip}`}
          >
            <div className="tc-header">
              <div className="tc-icon-title">
                <div className="tc-icon" aria-hidden="true">{renderModeIcon(impact.mode)}</div>
                <div className="tc-title-group">
                  <span className="tc-name">{getProviderFullName(impact.mode)}</span>
                  <span className="tc-rate-label">{impact.status}</span>
                </div>
              </div>
              <span className={`tc-badge ${badge.className}`}>{badge.text}</span>
            </div>

            <div className="tc-body">
              <p className="tc-tip">{impact.tip}</p>
            </div>

            <div className={`tc-severity-bar severity-bar-${impact.severity}`} aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
}
