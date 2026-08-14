import { describe, it, expect } from 'vitest';
import { REGIONS } from '../utils/regions';
import { REGION_CITIES } from '../utils/cities';

// Extract the pure search function from RegionSearch component
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
    return REGIONS.map((r) => ({
      type: 'region' as const,
      regionId: r.id,
      label: r.number,
      sublabel: r.label,
    }));
  }

  const results: SearchResult[] = [];

  // Search regions loop
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

  // Search cities loop
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

  return results.slice(0, 20);
}

describe('buildSearchResults (nested loop search)', () => {
  it('returns all regions when query is empty', () => {
    const results = buildSearchResults('');
    expect(results.length).toBe(REGIONS.length);
    expect(results.every((r) => r.type === 'region')).toBe(true);
  });

  it('returns all regions for whitespace-only query', () => {
    const results = buildSearchResults('   ');
    expect(results.length).toBe(REGIONS.length);
  });

  it('finds a region by ID', () => {
    const results = buildSearchResults('NCR');
    expect(results.some((r) => r.regionId === 'NCR' && r.type === 'region')).toBe(true);
  });

  it('finds a region by keyword', () => {
    const results = buildSearchResults('baguio');
    expect(results.some((r) => r.regionId === 'CAR' && r.type === 'region')).toBe(true);
  });

  it('finds a city by name', () => {
    const results = buildSearchResults('makati');
    const cityResult = results.find((r) => r.type === 'city' && r.cityName === 'Makati');
    expect(cityResult).toBeDefined();
    expect(cityResult!.regionId).toBe('NCR');
  });

  it('search is case-insensitive', () => {
    const results1 = buildSearchResults('CEBU');
    const results2 = buildSearchResults('cebu');
    expect(results1.length).toBe(results2.length);
  });

  it('limits results to 20', () => {
    // 'city' should match many cities
    const results = buildSearchResults('city');
    expect(results.length).toBeLessThanOrEqual(20);
  });

  it('returns both regions and cities for broad queries', () => {
    const results = buildSearchResults('davao');
    const hasRegion = results.some((r) => r.type === 'region');
    const hasCity = results.some((r) => r.type === 'city');
    expect(hasRegion).toBe(true);
    expect(hasCity).toBe(true);
  });

  it('returns empty for nonsense query', () => {
    const results = buildSearchResults('xyznonexistent');
    expect(results.length).toBe(0);
  });

  it('handles partial city name matches', () => {
    const results = buildSearchResults('gen');
    // Should find "General Santos", "General Trias", "General Luna", etc.
    expect(results.some((r) => r.type === 'city')).toBe(true);
  });

  it('nested city loop iterates all regions', () => {
    // Verify cities from different regions are searchable
    const manila = buildSearchResults('manila');
    const cebu = buildSearchResults('cebu city');
    const davaoCity = buildSearchResults('davao city');

    expect(manila.some((r) => r.regionId === 'NCR')).toBe(true);
    expect(cebu.some((r) => r.regionId === 'Central Visayas')).toBe(true);
    expect(davaoCity.some((r) => r.regionId === 'Davao')).toBe(true);
  });
});
