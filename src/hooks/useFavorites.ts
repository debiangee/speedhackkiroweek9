import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ph-rain-favorites';

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
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
