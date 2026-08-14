import { MapPinIcon } from './Icons';
import { getCitiesForRegion } from '../utils/cities';
import './CitySelector.css';

interface Props {
  region: string;
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
}

export function CitySelector({ region, selectedCity, onSelectCity }: Props) {
  const cities = getCitiesForRegion(region);

  if (cities.length === 0) return null;

  return (
    <div className="city-selector" role="listbox" aria-label={`Cities in ${region}`}>
      <button
        className={`city-chip ${selectedCity === null ? 'active' : ''}`}
        onClick={() => onSelectCity(null)}
        role="option"
        aria-selected={selectedCity === null}
      >
        <MapPinIcon size={12} color={selectedCity === null ? 'white' : 'var(--text-muted)'} />
        <span>Entire Region</span>
      </button>
      {cities.map((city) => (
        <button
          key={city.name}
          className={`city-chip ${selectedCity === city.name ? 'active' : ''}`}
          onClick={() => onSelectCity(city.name)}
          role="option"
          aria-selected={selectedCity === city.name}
        >
          <span>{city.name}</span>
        </button>
      ))}
    </div>
  );
}
