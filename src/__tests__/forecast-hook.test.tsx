import { it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { useWeatherData } from '../hooks/useWeatherData';
import { clearCache } from '../hooks/useWeatherCache';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearCache(); });
it('provider failure produces an explicit unavailable state and no invented weather', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  const { result } = renderHook(() => useWeatherData('NCR'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toMatch(/unavailable/);
  expect(result.current.hourly).toEqual([]);
  expect(result.current.daily).toEqual([]);
});
it('hides previous-location results immediately while a new location is loading', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  const { result, rerender } = renderHook(({ region }) => useWeatherData(region), { initialProps: { region: 'NCR' } });
  await waitFor(() => expect(result.current.loading).toBe(false));
  rerender({ region: 'Bicol' });
  expect(result.current.loading).toBe(true);
  expect(result.current.hourly).toEqual([]);
});
