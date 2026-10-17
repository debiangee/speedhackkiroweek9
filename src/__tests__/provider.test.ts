import { it, expect, vi, afterEach } from 'vitest';
import { requestForecast } from '../services/forecast-provider';
import { FORECAST_FIELDS } from '../services/forecast-parser';
import { resolveLocation, locationById } from '../utils/locations';
import { clearCache } from '../hooks/useWeatherCache';
function fixture() {
  return { timezone: 'Asia/Manila', hourly: { time: ['2026-10-18T00:00'], ...Object.fromEntries(FORECAST_FIELDS.map(f => [f, [f === 'temperature_2m' ? 28 : f === 'visibility' ? 10000 : 0]])) } };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); clearCache(); });
it('deduplicates concurrent point requests and retains exact provenance', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T16:30:00Z'));
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => fixture() }); vi.stubGlobal('fetch', fetcher);
  const point = { lat: 14.123, lon: 121.123 };
  const [a,b] = await Promise.all([requestForecast(point), requestForecast(point)]);
  expect(fetcher).toHaveBeenCalledTimes(1); expect(a).toEqual(b);
  expect(a.metadata.modelReferenceTime).toBeNull(); expect(a.metadata.point).toEqual(point);
  expect(a.metadata.delivery).toBe('network');
  vi.advanceTimersByTime(10000);
  expect((await requestForecast(point)).metadata).toEqual(expect.objectContaining({ delivery: 'cache', cacheAgeMs: 10000 }));
});
it('cancels a subscriber without cancelling another consumer', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T16:30:00Z'));
  let finish!: (response: unknown) => void;
  const fetcher = vi.fn().mockImplementation(() => new Promise(resolve => { finish = resolve; })); vi.stubGlobal('fetch', fetcher);
  const controller = new AbortController();
  const a = requestForecast({ lat: 14.124, lon: 121.124 }, controller.signal);
  const b = requestForecast({ lat: 14.124, lon: 121.124 });
  const rejected = expect(a).rejects.toMatchObject({ name: 'AbortError' }); controller.abort(); await rejected;
  expect(fetcher.mock.calls[0][1].signal.aborted).toBe(false);
  finish({ ok: true, json: async () => fixture() });
  expect((await b).hourly).toHaveLength(1);
});
it('rejects incomplete provider data without caching favorable defaults', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hourly: {} }) }));
  await expect(requestForecast({lat:14.125, lon:121.125})).rejects.toMatchObject({ kind: 'invalid' });
});
it('stable city identity resolves within the same region and rejects unknown cities', () => {
  const makati = resolveLocation('NCR', 'Makati')!;
  expect(makati.timezone).toBe('Asia/Manila'); expect(makati.source).toBe('catalog-city');
  expect(locationById(makati.id)).toEqual(makati);
  expect(resolveLocation('NCR', 'not a city')).toBeNull();
  expect(resolveLocation('NCR')?.lat).not.toBe(makati.lat);
});
