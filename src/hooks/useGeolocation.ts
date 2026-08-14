import { useState, useCallback } from 'react';
import { REGION_CITIES } from '../utils/cities';

// Haversine formula to find distance between two points
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

// Find the nearest region AND city from GPS coordinates
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

interface GeolocationResult {
  region: string;
  city: string;
}

interface GeolocationState {
  detecting: boolean;
  error: string | null;
  detected: GeolocationResult | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    detecting: false,
    error: null,
    detected: null,
  });

  const detect = useCallback((): Promise<GeolocationResult | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState({ detecting: false, error: 'Geolocation not supported', detected: null });
        resolve(null);
        return;
      }

      setState({ detecting: true, error: null, detected: null });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = findNearestLocation(position.coords.latitude, position.coords.longitude);
          setState({ detecting: false, error: null, detected: result });
          resolve(result);
        },
        (err) => {
          let errorMsg = 'Could not detect location';
          if (err.code === 1) errorMsg = 'Location access denied';
          if (err.code === 2) errorMsg = 'Location unavailable';
          if (err.code === 3) errorMsg = 'Location request timed out';
          setState({ detecting: false, error: errorMsg, detected: null });
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }, []);

  return { ...state, detect };
}
