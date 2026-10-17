/** Shared cache: 30 minutes, including persistent entries. No unlimited stale fallback. */
export const CACHE_DURATION = 30 * 60 * 1000;
const LS_PREFIX = 'ph-rain-cache-';
interface CacheEntry { data: unknown; timestamp: number }
const cache = new Map<string, CacheEntry>();
function valid(entry: CacheEntry): boolean {
  const age = Date.now() - entry.timestamp;
  return Number.isFinite(entry.timestamp) && age >= 0 && age < CACHE_DURATION;
}
export function getCached<T>(key: string, _stale?: boolean): T | null {
  let entry = cache.get(key);
  try {
    if (!entry) { const raw = localStorage.getItem(`${LS_PREFIX}${key}`); if (raw) entry = JSON.parse(raw); }
    if (entry && valid(entry)) return entry.data as T;
    cache.delete(key);
    localStorage.removeItem(`${LS_PREFIX}${key}`);
  } catch { /* Storage is optional. */ }
  return null;
}
export function setCache(key: string, data: unknown): void {
  const entry = { data, timestamp: Date.now() };
  if (cache.size >= 64) cache.delete(cache.keys().next().value!);
  cache.set(key, entry);
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    for (const old of keys) {
      try { if (!valid(JSON.parse(localStorage.getItem(old)!))) localStorage.removeItem(old); } catch { localStorage.removeItem(old); }
    }
    const remaining = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    if (remaining.length >= 64) localStorage.removeItem(remaining[0]);
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(entry));
  } catch { /* Storage is optional. */ }
}
/** Compatibility export: expired data is deliberately unavailable. */
export function getStaleCached<T>(key: string): T | null { return getCached<T>(key); }
export function clearCache(): void {
  cache.clear();
  try { for (const key of Object.keys(localStorage)) if (key.startsWith(LS_PREFIX)) localStorage.removeItem(key); } catch { /* optional */ }
}
