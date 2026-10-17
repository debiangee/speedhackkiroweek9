/** Browser storage is optional and untrusted. Denied/quota/full storage is nonfatal. */
export function readPreference(key: string, session = false): string | null {
  try { return (session ? window.sessionStorage : window.localStorage).getItem(key); } catch { return null; }
}
export function writePreference(key: string, value: string | null, session = false): boolean {
  try { const storage = session ? window.sessionStorage : window.localStorage; if (value === null) storage.removeItem(key); else storage.setItem(key, value); return true; } catch { return false; }
}
