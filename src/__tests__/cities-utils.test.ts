import { describe, it, expect } from 'vitest';
import { REGION_CITIES, getCitiesForRegion, getCityCoords } from '../utils/cities';
import { REGIONS, getRegionLabel, getRegionNumber } from '../utils/regions';

describe('getCitiesForRegion (iterates REGION_CITIES map)', () => {
  it('returns cities for NCR', () => {
    const cities = getCitiesForRegion('NCR');
    expect(cities.length).toBeGreaterThan(0);
    expect(cities.some((c) => c.name === 'Manila')).toBe(true);
  });

  it('returns cities for every defined region', () => {
    for (const region of REGIONS) {
      const cities = getCitiesForRegion(region.id);
      expect(cities.length).toBeGreaterThan(0);
    }
  });

  it('returns empty array for unknown region', () => {
    const cities = getCitiesForRegion('FAKE_REGION');
    expect(cities).toEqual([]);
  });

  it('all cities have valid coordinates', () => {
    for (const [, cities] of Object.entries(REGION_CITIES)) {
      for (const city of cities) {
        expect(city.lat).toBeGreaterThan(4); // Philippines lat range
        expect(city.lat).toBeLessThan(21);
        expect(city.lon).toBeGreaterThan(116); // Philippines lon range
        expect(city.lon).toBeLessThan(127);
        expect(city.name.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getCityCoords (find loop within region)', () => {
  it('returns coords for known city', () => {
    const coords = getCityCoords('NCR', 'Manila');
    expect(coords).toEqual({ lat: 14.5995, lon: 120.9842 });
  });

  it('returns null for unknown city in valid region', () => {
    const coords = getCityCoords('NCR', 'Atlantis');
    expect(coords).toBeNull();
  });

  it('returns null for unknown region', () => {
    const coords = getCityCoords('FAKE', 'Manila');
    expect(coords).toBeNull();
  });

  it('can find last city in a region list', () => {
    const ncrCities = REGION_CITIES['NCR'];
    const lastCity = ncrCities[ncrCities.length - 1];
    const coords = getCityCoords('NCR', lastCity.name);
    expect(coords).toEqual({ lat: lastCity.lat, lon: lastCity.lon });
  });
});

describe('getRegionLabel (find loop)', () => {
  it('returns full label for valid region', () => {
    expect(getRegionLabel('NCR')).toBe('NCR - National Capital Region');
  });

  it('returns the id itself for unknown region', () => {
    expect(getRegionLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('works for all defined regions', () => {
    for (const region of REGIONS) {
      expect(getRegionLabel(region.id)).toBe(region.label);
    }
  });
});

describe('getRegionNumber (find loop)', () => {
  it('returns region number for valid region', () => {
    expect(getRegionNumber('NCR')).toBe('NCR');
    expect(getRegionNumber('Bicol')).toBe('Region V');
  });

  it('returns the id itself for unknown region', () => {
    expect(getRegionNumber('UNKNOWN')).toBe('UNKNOWN');
  });

  it('works for all defined regions', () => {
    for (const region of REGIONS) {
      expect(getRegionNumber(region.id)).toBe(region.number);
    }
  });
});
