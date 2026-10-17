/** Provider timestamps without an offset are always Philippine local time. */
export const PH_TIMEZONE = 'Asia/Manila';
export function manilaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: PH_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function manilaHour(now = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: PH_TIMEZONE, hour: '2-digit', hourCycle: 'h23' }).format(now));
}
export function forecastEpoch(time: string): number { return Date.parse(time + (/[Z]|[+-]\d\d:\d\d$/.test(time) ? '' : '+08:00')); }
export function currentForecastIndex(entries: { time: string }[], now = Date.now()): number {
  return entries.findIndex(h => forecastEpoch(h.time) <= now && forecastEpoch(h.time) + 3600000 > now);
}
export function remainingForecast<T extends { time: string }>(entries: T[], now = Date.now()): T[] {
  return entries.filter(h => forecastEpoch(h.time) + 3600000 > now);
}
