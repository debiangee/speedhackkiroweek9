import { useState, useRef, useEffect } from 'react';
import { SearchIcon, MapPinIcon, XIcon } from './Icons';
import { REGIONS } from '../utils/regions';
import { REGION_CITIES } from '../utils/cities';
import './RegionSearch.css';

interface Props {
  selected: string;
  onSelect: (region: string, city?: string) => void;
}

interface SearchResult {
  type: 'region' | 'city';
  regionId: string;
  cityName?: string;
  label: string;
  sublabel: string;
}

function buildSearchResults(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) {
    // Show all regions when no query
    return REGIONS.map((r) => ({
      type: 'region',
      regionId: r.id,
      label: r.number,
      sublabel: r.label,
    }));
  }

  const results: SearchResult[] = [];

  // Search regions
  for (const r of REGIONS) {
    if (
      r.id.toLowerCase().includes(q) ||
      r.label.toLowerCase().includes(q) ||
      r.number.toLowerCase().includes(q) ||
      r.keywords.includes(q)
    ) {
      results.push({
        type: 'region',
        regionId: r.id,
        label: r.number,
        sublabel: r.label,
      });
    }
  }

  // Search cities
  for (const [regionId, cities] of Object.entries(REGION_CITIES)) {
    for (const city of cities) {
      if (city.name.toLowerCase().includes(q)) {
        const regionInfo = REGIONS.find((r) => r.id === regionId);
        results.push({
          type: 'city',
          regionId,
          cityName: city.name,
          label: city.name,
          sublabel: regionInfo ? `${regionInfo.number} - ${regionId}` : regionId,
        });
      }
    }
  }

  // Limit results to keep it fast
  return results.slice(0, 20);
}

export function RegionSearch({ selected, onSelect }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = buildSearchResults(searchQuery);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    if (result.type === 'city') {
      onSelect(result.regionId, result.cityName);
    } else {
      onSelect(result.regionId);
    }
    setSearchQuery('');
    setIsOpen(false);
  }

  return (
    <div className="region-search" ref={containerRef}>
      <div className="search-input-wrapper">
        <SearchIcon size={18} color="var(--text-muted)" className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search region or city..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          aria-label="Search for a Philippine region or city"
          aria-expanded={isOpen}
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <XIcon size={16} color="var(--text-muted)" />
          </button>
        )}
      </div>

      {isOpen && (
        <ul className="search-dropdown" role="listbox">
          {results.length === 0 ? (
            <li className="search-empty">No results found</li>
          ) : (
            results.map((r, i) => (
              <li
                key={`${r.regionId}-${r.cityName || ''}-${i}`}
                className={`search-item ${r.type === 'city' ? 'is-city' : ''} ${r.regionId === selected && !r.cityName ? 'active' : ''}`}
                onClick={() => handleSelect(r)}
                role="option"
                aria-selected={r.regionId === selected && !r.cityName}
              >
                <MapPinIcon
                  size={14}
                  color={r.type === 'city' ? 'var(--warning)' : 'var(--accent)'}
                />
                <span className="search-item-text">
                  <strong>{r.label}</strong>
                  <small>{r.sublabel}</small>
                </span>
                {r.type === 'city' && (
                  <span className="search-type-badge">City</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
