import { useState, useRef, useEffect, useId } from 'react';
import { SearchIcon, MapPinIcon, XIcon } from './Icons';
import { REGIONS } from '../utils/regions';
import { REGION_CITIES } from '../utils/cities';
import './RegionSearch.css';
import { useLocale } from '../hooks/useLocale';

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

export function buildSearchResults(query: string): SearchResult[] {
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
  return results.sort((a, b) => Number(b.cityName?.toLowerCase() === q) - Number(a.cityName?.toLowerCase() === q)).slice(0, 20);
}

export function RegionSearch({ selected, onSelect }: Props) {
  const { locale } = useLocale();
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
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
          placeholder={locale === 'fil' ? 'Hanapin ang rehiyon o lungsod…' : 'Search region or city…'}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={isOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          onKeyDown={e => {
            if (e.key === 'Escape') { setIsOpen(false); setActiveIndex(-1); }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setIsOpen(true); setActiveIndex(i => Math.max(0, Math.min(results.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))); }
            if (e.key === 'Enter' && isOpen && results[activeIndex]) { e.preventDefault(); handleSelect(results[activeIndex]); setActiveIndex(-1); }
          }}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          aria-label={locale === 'fil' ? 'Hanapin ang rehiyon o lungsod' : 'Search for a Philippine region or city'}
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
        <ul className="search-dropdown" role="listbox" id={listId} aria-label="Location suggestions">
          {results.length === 0 ? (
            <li className="search-empty">No results found</li>
          ) : (
            results.map((r, i) => (
              <li
                key={`${r.regionId}-${r.cityName || ''}-${i}`}
                id={`${listId}-${i}`}
                data-active={activeIndex === i}
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
