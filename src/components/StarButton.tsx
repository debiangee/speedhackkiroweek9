import './StarButton.css';

interface Props {
  isFavorite: boolean;
  onClick: () => void;
  label?: string;
}

export function StarButton({ isFavorite, onClick, label }: Props) {
  return (
    <button
      className={`star-button ${isFavorite ? 'active' : ''}`}
      onClick={onClick}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorite ? 'Remove from saved' : 'Save this region'}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill={isFavorite ? '#f59e0b' : 'none'} stroke={isFavorite ? '#f59e0b' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      {label && <span className="star-label">{label}</span>}
    </button>
  );
}
