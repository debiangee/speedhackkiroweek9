// Cache for API responses - prevents hitting rate limits
// Cache expires after 60 minutes (Open-Meteo updates hourly anyway)
// Also persists to localStorage as a fallback for offline/error scenarios

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes — Open-Meteo updates every 15-60 min
const LS_PREFIX = 'ph-rain-cache-';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export function getCached<T>(key: string, stale?: boolean): T | null {
  const entry = cache.get(key);
  if (entry) {
    if (Date.now() - entry.timestamp <= CACHE_DURATION) {
      return entry.data as T;
    }
    cache.delete(key);
  }

  // If stale flag is set, fall back to localStorage regardless of TTL
  if (stale) {
    return getStaleCached<T>(key);
  }

  return null;
}

export function setCache(key: string, data: unknown): void {
  const timestamp = Date.now();
  cache.set(key, { data, timestamp });

  // Persist to localStorage for offline fallback
  try {
    localStorage.setItem(
      `${LS_PREFIX}${key}`,
      JSON.stringify({ data, timestamp })
    );
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function getStaleCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (!raw) return null;
    const parsed: CacheEntry = JSON.parse(raw);
    return parsed.data as T;
  } catch {
    return null;
  }
}

export function clearCache(): void {
  cache.clear();
}
