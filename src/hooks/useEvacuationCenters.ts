import { useState, useEffect, useCallback, useRef } from 'react';
import { getCached, setCache } from '../hooks/useWeatherCache';

export interface EvacuationCenter {
  id: number;
  name: string;
  type: 'shelter' | 'assembly_point' | 'community_center' | 'civic';
  lat: number;
  lon: number;
  distance: number; // km from input coordinates
  address?: string;
  capacity?: string;
  phone?: string;
}

interface EvacuationState {
  loading: boolean;
  error: string | null;
  centers: EvacuationCenter[];
  searchRadius: number; // km
}

const SEARCH_RADIUS_KM = 5;
const MAX_RESULTS = 15;
const CACHE_KEY_PREFIX = 'evacuation-centers-';

/** Haversine formula — returns distance in km between two lat/lon points */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Determine center type from OSM tags */
function resolveType(
  tags: Record<string, string>
): EvacuationCenter['type'] {
  if (tags.emergency === 'assembly_point') return 'assembly_point';
  if (tags.amenity === 'community_centre') return 'community_center';
  if (tags.building === 'civic') return 'civic';
  return 'shelter';
}

/** Build the Overpass QL query for a given lat/lon */
function buildQuery(lat: number, lon: number): string {
  return `[out:json][timeout:10];
(
  node["amenity"="shelter"](around:5000,${lat},${lon});
  node["emergency"="assembly_point"](around:5000,${lat},${lon});
  node["social_facility"="shelter"](around:5000,${lat},${lon});
  way["amenity"="shelter"](around:5000,${lat},${lon});
  way["emergency"="assembly_point"](around:5000,${lat},${lon});
  node["building"="civic"](around:5000,${lat},${lon});
  node["amenity"="community_centre"](around:5000,${lat},${lon});
);
out center body;`;
}

export function useEvacuationCenters(lat: number | null, lon: number | null) {
  const [state, setState] = useState<EvacuationState>({
    loading: false,
    error: null,
    centers: [],
    searchRadius: SEARCH_RADIUS_KM,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchCenters = useCallback(
    async (latitude: number, longitude: number) => {
      // Check cache first (keyed by rounded coords for stability)
      const cacheKey = `${CACHE_KEY_PREFIX}${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
      const cached = getCached<EvacuationCenter[]>(cacheKey);
      if (cached) {
        setState({
          loading: false,
          error: null,
          centers: cached,
          searchRadius: SEARCH_RADIUS_KM,
        });
        return;
      }

      // Abort any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const query = buildQuery(latitude, longitude);
        const response = await fetch(
          'https://overpass-api.de/api/interpreter',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Overpass API error: ${response.status}`);
        }

        const json = await response.json();

        const centers: EvacuationCenter[] = (json.elements || [])
          .map((el: any) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLon = el.lon ?? el.center?.lon;
            if (elLat == null || elLon == null) return null;

            const tags: Record<string, string> = el.tags || {};
            const distance = haversineDistance(latitude, longitude, elLat, elLon);

            return {
              id: el.id,
              name: tags.name || tags['name:en'] || 'Unnamed Facility',
              type: resolveType(tags),
              lat: elLat,
              lon: elLon,
              distance: Math.round(distance * 100) / 100,
              address: tags['addr:full'] || tags['addr:street'] || undefined,
              capacity: tags.capacity || undefined,
              phone: tags.phone || tags['contact:phone'] || undefined,
            } as EvacuationCenter;
          })
          .filter(Boolean) as EvacuationCenter[];

        // Sort by distance and limit
        centers.sort((a, b) => a.distance - b.distance);
        const limited = centers.slice(0, MAX_RESULTS);

        // Cache for 1 hour
        setCache(cacheKey, limited);

        setState({
          loading: false,
          error: null,
          centers: limited,
          searchRadius: SEARCH_RADIUS_KM,
        });
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch evacuation centers',
        }));
      }
    },
    []
  );

  useEffect(() => {
    if (lat == null || lon == null) {
      setState({ loading: false, error: null, centers: [], searchRadius: SEARCH_RADIUS_KM });
      return;
    }

    fetchCenters(lat, lon);

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [lat, lon, fetchCenters]);

  return state;
}
