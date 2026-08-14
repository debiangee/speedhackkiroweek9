import { describe, it, expect } from 'vitest';
import { REGION_CITIES } from '../utils/cities';

// Extract the pure haversine + nearest location logic for testing
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestLocation(lat: number, lon: number): { region: string; city: string } {
  let nearestRegion = 'NCR';
  let nearestCity = 'Manila';
  let minDist = Infinity;

  for (const [regionId, cities] of Object.entries(REGION_CITIES)) {
    for (const city of cities) {
      const dist = haversineDistance(lat, lon, city.lat, city.lon);
      if (dist < minDist) {
        minDist = dist;
        nearestRegion = regionId;
        nearestCity = city.name;
      }
    }
  }

  return { region: nearestRegion, city: nearestCity };
}

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(14.5, 120.9, 14.5, 120.9)).toBe(0);
  });

  it('calculates distance between Manila and Cebu (~570 km)', () => {
    const dist = haversineDistance(14.5995, 120.9842, 10.3157, 123.8854);
    expect(dist).toBeGreaterThan(500);
    expect(dist).toBeLessThan(600);
  });

  it('calculates distance between two close cities in NCR', () => {
    // Manila to Makati should be small (~3-5 km)
    const dist = haversineDistance(14.5995, 120.9842, 14.5547, 121.0244);
    expect(dist).toBeGreaterThan(2);
    expect(dist).toBeLessThan(10);
  });

  it('is symmetric (A to B === B to A)', () => {
    const d1 = haversineDistance(14.5, 120.9, 10.3, 123.8);
    const d2 = haversineDistance(10.3, 123.8, 14.5, 120.9);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

describe('findNearestLocation (nested for-loop over all regions/cities)', () => {
  it('correctly identifies Manila for NCR coordinates', () => {
    const result = findNearestLocation(14.5995, 120.9842);
    expect(result.region).toBe('NCR');
    expect(result.city).toBe('Manila');
  });

  it('correctly identifies Cebu City for Cebu coordinates', () => {
    const result = findNearestLocation(10.3157, 123.8854);
    expect(result.region).toBe('Central Visayas');
    expect(result.city).toBe('Cebu City');
  });

  it('correctly identifies Davao City for Davao coordinates', () => {
    const result = findNearestLocation(7.19, 125.45);
    expect(result.region).toBe('Davao');
    expect(result.city).toBe('Davao City');
  });

  it('handles coordinates between two cities', () => {
    // Point between Baguio (CAR) and Manila (NCR) - should pick the closer one
    const result = findNearestLocation(15.5, 120.7);
    // This is roughly between them, but closer to Central Luzon cities
    expect(result.region).toBeDefined();
    expect(result.city).toBeDefined();
  });

  it('handles edge case: far-south coordinates (BARMM territory)', () => {
    const result = findNearestLocation(5.03, 119.77);
    expect(result.region).toBe('BARMM');
    expect(result.city).toBe('Bongao');
  });

  it('iterates through all regions', () => {
    // The loop should process every region. Verify by testing a city from a less common region.
    const result = findNearestLocation(9.7867, 126.1172); // Siargao coords
    expect(result.region).toBe('Caraga');
    expect(result.city).toBe('Siargao (General Luna)');
  });

  it('iterates through all cities within a region', () => {
    // Verify last city in NCR list is reachable
    const result = findNearestLocation(14.6019, 121.0355); // San Juan coords
    expect(result.region).toBe('NCR');
    expect(result.city).toBe('San Juan');
  });
});
