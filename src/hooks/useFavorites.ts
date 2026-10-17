import { readPreference, writePreference } from '../utils/storage';
import { REGIONS } from '../utils/regions';
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ph-rain-favorites';

function loadFavorites(): string[] {
  try {
    const stored = readPreference(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((r): r is string => typeof r === 'string' && REGIONS.some(region => region.id === r)) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: string[]) {
  writePreference(STORAGE_KEY, JSON.stringify(favorites));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  const addFavorite = useCallback((region: string) => {
    setFavorites((prev) => {
      if (prev.includes(region)) return prev;
      const next = [...prev, region];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((region: string) => {
    setFavorites((prev) => {
      const next = prev.filter((r) => r !== region);
      saveFavorites(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((region: string) => {
    setFavorites((prev) => {
      const next = prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region];
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (region: string) => favorites.includes(region),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite };
}
