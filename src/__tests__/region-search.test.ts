import { describe, it, expect } from 'vitest';
import { REGIONS } from '../utils/regions';

import { buildSearchResults } from '../components/RegionSearch';

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
