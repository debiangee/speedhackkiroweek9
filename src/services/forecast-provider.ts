import { getCached, setCache } from '../hooks/useWeatherCache';
import type { ForecastRecord } from '../models/weather';
import { parseForecast, revalidateHourly, FORECAST_FIELDS } from './forecast-parser';
import { currentForecastIndex, manilaDate } from '../utils/time';

export class ForecastError extends Error {
  constructor(public readonly kind: 'network' | 'timeout' | 'rate-limit' | 'invalid' | 'unavailable', message: string) { super(message); this.name = 'ForecastError'; }
}
interface Pending { promise: Promise<ForecastRecord>; controller: AbortController; subscribers: number }
const pending = new Map<string, Pending>();
async function download(lat: number, lon: number, signal: AbortSignal): Promise<ForecastRecord> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${FORECAST_FIELDS.join(',')}&timezone=Asia/Manila&forecast_days=7&wind_speed_unit=kmh&temperature_unit=celsius&precipitation_unit=mm`;
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try { response = await fetch(url, { signal, cache: 'no-store' }); }
    catch { throw new ForecastError(signal.aborted ? 'timeout' : 'network', 'Forecast unavailable: network failure or request timeout. No expired forecast is used.'); }
    if ((response.status === 429 || response.status >= 500) && attempt === 0) {
      await new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(new ForecastError('timeout', 'Forecast request cancelled')); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 500);
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
      });
      continue;
    }
    if (!response.ok) throw new ForecastError(response.status === 429 ? 'rate-limit' : 'unavailable', `Forecast provider unavailable (${response.status}). Please retry.`);
    try {
      const data = parseForecast(await response.json());
      if (currentForecastIndex(data.hourly) < 0 || data.daily[0].date !== manilaDate()) throw new Error('No current forecast hour');
      const record: ForecastRecord = { ...data, metadata: { provider: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', point: { lat, lon }, timezone: 'Asia/Manila', modelReferenceTime: null, retrievedAt: Date.now(), validFrom: data.hourly[0].time, validTo: data.hourly[data.hourly.length - 1].time, quality: 'validated', delivery: 'network', cacheAgeMs: 0, units: { temperature: '°C', wind: 'km/h', precipitation: 'mm', visibility: 'm', probability: '%' } } };
      setCache(`forecast-v3-${lat}-${lon}`, record);
      return record;
    } catch { throw new ForecastError('invalid', 'Forecast unavailable: invalid or incomplete provider response'); }
  }
  throw new ForecastError('unavailable', 'Forecast provider unavailable');
}
/** Shared point request. Abort one subscriber without cancelling other consumers. */
export function requestForecast(point: { lat: number; lon: number }, signal?: AbortSignal): Promise<ForecastRecord> {
  const { lat, lon } = point;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return Promise.reject(new ForecastError('invalid', 'Unknown forecast coordinates'));
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  const key = `forecast-v3-${lat}-${lon}`;
  const cached = getCached<ForecastRecord>(key);
  try {
    const meta=cached?.metadata;
    if(meta?.provider==='Open-Meteo' && meta.quality==='validated' && meta.point.lat===lat && meta.point.lon===lon && Number.isFinite(meta.retrievedAt) && Date.now()-meta.retrievedAt>=0 && Date.now()-meta.retrievedAt<1800000) {
      const validated=revalidateHourly(cached?.hourly);
      if(currentForecastIndex(validated.hourly)>=0 && validated.daily[0].date===manilaDate()) return Promise.resolve({...validated,metadata:{...meta,modelReferenceTime:null,delivery:'cache',cacheAgeMs:Date.now()-meta.retrievedAt,validFrom:validated.hourly[0].time,validTo:validated.hourly[validated.hourly.length-1].time}});
    }
  } catch { /* Corrupt browser data is discarded; fetch validated provider data. */ }
  let entry = pending.get(key);
  if (!entry || entry.controller.signal.aborted) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const created: Pending = { controller, subscribers: 0, promise: Promise.resolve(null as unknown as ForecastRecord) };
    created.promise = download(lat, lon, controller.signal).finally(() => { clearTimeout(timer); if (pending.get(key) === created) pending.delete(key); });
    pending.set(key, created); entry = created;
  }
  const shared = entry;
  shared.subscribers++;
  return new Promise((resolve, reject) => {
    let done = false;
    const release = () => {
      if (done) return; done = true; shared.subscribers--; signal?.removeEventListener('abort', abort);
      if (!shared.subscribers) setTimeout(() => { if (!shared.subscribers) shared.controller.abort(); }, 0);
    };
    const abort = () => { release(); reject(new DOMException('Aborted', 'AbortError')); };
    signal?.addEventListener('abort', abort, { once: true });
    shared.promise.then(value => { if (!done) { release(); resolve(value); } }, error => { if (!done) { release(); reject(error); } });
  });
}
