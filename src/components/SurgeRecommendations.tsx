import type { Recommendation } from '../utils/surge-engine';
import { ZapIcon, HourglassIcon, RepeatIcon } from './Icons';
import './SurgeRecommendations.css';

interface Props {
  recommendations: Recommendation[];
}

function renderActionIcon(action: Recommendation['action']) {
  switch (action) {
    case 'book_now':
      return <ZapIcon size={18} color="currentColor" />;
    case 'wait':
      return <HourglassIcon size={18} color="currentColor" />;
    case 'switch_mode':
      return <RepeatIcon size={18} color="currentColor" />;
    default:
      return <ZapIcon size={18} color="currentColor" />;
  }
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'High confidence',
  moderate: 'Moderate',
  low: 'Low confidence',
};

export function SurgeRecommendations({ recommendations }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <div className="surge-recs" role="list" aria-label="Booking recommendations">
      {recommendations.map((rec) => (
        <div
          key={rec.priority}
          className={`surge-rec-card action-${rec.action}`}
          role="listitem"
        >
          <div className="rec-priority" aria-hidden="true">{renderActionIcon(rec.action)}</div>
          <div className="rec-body">
            <strong className="rec-action-title">{rec.title}</strong>
            <p className="rec-description">{rec.description}</p>
            <div className="rec-meta">
              {rec.savings > 0 && (
                <span className="rec-savings">~{rec.savings}% savings</span>
              )}
              <span className={`rec-confidence conf-${rec.confidence}`}>
                {CONFIDENCE_LABELS[rec.confidence]}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
