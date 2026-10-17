import { locationById, resolveLocation, type WeatherLocation } from './locations';
import { manilaDate } from './time';
export function validForecastDate(date: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date+'T00:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date) return false;
  const today = manilaDate(now);
  const end = new Date(today+'T00:00:00Z'); end.setUTCDate(end.getUTCDate()+6);
  return date >= today && date <= end.toISOString().slice(0,10);
}
export function forecastContext(search: string, now = new Date(), preferredId?: string | null): {location: WeatherLocation; date: string; notice: string | null} {
  const params = new URLSearchParams(search);
  const requested = params.get('location'); const date = params.get('date');
  const location = (requested ? locationById(requested) : preferredId ? locationById(preferredId) : null) ?? resolveLocation('NCR')!;
  const invalid = Boolean((requested && !locationById(requested)) || (date && !validForecastDate(date, now)));
  return {location, date: date && validForecastDate(date,now) ? date : manilaDate(now), notice: invalid ? 'Shared location or date is unavailable. Showing a valid location and current forecast period instead.' : requested ? 'Shared forecast context: data is fetched for this visit, not frozen at the time the link was shared.' : null};
}
export function forecastUrl(base: string, locationId: string, date: string): string {
  const url = new URL(base); url.search = ''; url.hash = '#forecast';
  url.searchParams.set('location', locationId); url.searchParams.set('date', date);
  return url.toString();
}
