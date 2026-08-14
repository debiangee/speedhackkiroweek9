import { MapPinIcon, XIcon } from './Icons';
import './FavoriteRegions.css';

interface Props {
  favorites: string[];
  selected: string;
  onSelect: (region: string) => void;
  onRemove: (region: string) => void;
}

export function FavoriteRegions({ favorites, selected, onSelect, onRemove }: Props) {
  if (favorites.length === 0) return null;

  return (
    <div className="favorite-regions">
      <span className="fav-label">
        <StarIcon size={14} color="#f59e0b" />
        Saved
      </span>
      <div className="fav-chips">
        {favorites.map((region) => (
          <div
            key={region}
            className={`fav-chip ${region === selected ? 'active' : ''}`}
          >
            <button
              className="fav-chip-btn"
              onClick={() => onSelect(region)}
              aria-label={`Select ${region}`}
            >
              <MapPinIcon size={12} color={region === selected ? '#1a73e8' : '#6b7280'} />
              {region}
            </button>
            <button
              className="fav-chip-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(region);
              }}
              aria-label={`Remove ${region} from favorites`}
            >
              <XIcon size={12} color="#9ca3af" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
