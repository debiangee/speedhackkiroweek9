import { REGION_CITIES } from './cities';
import { getRegionLabel } from './regions';
export interface WeatherLocation {
  id: string; name: string; region: string; lat: number; lon: number;
  timezone: 'Asia/Manila'; source: 'catalog-city' | 'regional-reference'; precision: 'representative-point';
}
export const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'NCR': { lat: 14.5995, lon: 120.9842 },
  'CAR': { lat: 16.4023, lon: 120.596 },
  'Ilocos': { lat: 17.5747, lon: 120.3869 },
  'Cagayan Valley': { lat: 17.6132, lon: 121.727 },
  'Central Luzon': { lat: 15.145, lon: 120.5887 },
  'CALABARZON': { lat: 14.1, lon: 121.3 },
  'MIMAROPA': { lat: 9.7392, lon: 118.7353 },
  'Bicol': { lat: 13.1391, lon: 123.7438 },
  'Western Visayas': { lat: 10.7202, lon: 122.5621 },
  'Central Visayas': { lat: 10.3157, lon: 123.8854 },
  'Eastern Visayas': { lat: 11.25, lon: 125.0 },
  'Zamboanga Peninsula': { lat: 6.9214, lon: 122.079 },
  'Northern Mindanao': { lat: 8.4542, lon: 124.6319 },
  'Davao': { lat: 7.1907, lon: 125.4553 },
  'SOCCSKSARGEN': { lat: 6.5, lon: 124.85 },
  'Caraga': { lat: 8.9475, lon: 125.5406 },
  'BARMM': { lat: 7.2, lon: 124.23 },
};

export function resolveLocation(region: string, city?: string | null): WeatherLocation | null {
  const found = city ? REGION_CITIES[region]?.find(c => c.name === city) : null;
  if (city && !found) return null;
  const point = found ?? REGION_COORDS[region];
  if (!point) return null;
  return { id: `${region}:${city || 'reference'}`, name: city || getRegionLabel(region), region, lat: point.lat, lon: point.lon, timezone: 'Asia/Manila', source: city ? 'catalog-city' : 'regional-reference', precision: 'representative-point' };
}
export const LOCATION_CATALOG: WeatherLocation[] = Object.keys(REGION_COORDS).flatMap(region => [resolveLocation(region)!, ...(REGION_CITIES[region] || []).map(c => resolveLocation(region, c.name)!)]);
export function locationById(id: string): WeatherLocation | null { return LOCATION_CATALOG.find(l => l.id === id) ?? null; }
