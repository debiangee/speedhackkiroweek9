import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { computeVerdict, findTravelWindows } from '../utils/trip-verdict';
import { parseForecast, FORECAST_FIELDS } from '../services/forecast-parser';
import { manilaDate, manilaHour, currentForecastIndex } from '../utils/time';
import { getCached, setCache, clearCache, CACHE_DURATION } from '../hooks/useWeatherCache';
import { WeatherSignalPanel } from '../components/WeatherSignalPanel';
import { EvacuationPanel } from '../components/EvacuationPanel';
import { TripGoChecker } from '../components/TripGoChecker';
import type { HourlyData } from '../hooks/useWeatherData';

const mocks = vi.hoisted(() => ({ weather: vi.fn(), facilities: vi.fn() }));
vi.mock('../hooks/useWeatherData', () => ({ useWeatherData: mocks.weather }));
vi.mock('../hooks/useEvacuationCenters', () => ({ useEvacuationCenters: mocks.facilities }));
const base: HourlyData = { time: '2026-10-18T12:00', date: '2026-10-18', hour: 12, temperature: 28, humidity: 70, precipitation: 0, precipitation_probability: 0, wind_speed: 5, wind_gusts: 10, weather_code: 0, cloud_cover: 0, dew_point: 20, visibility: 10000, uv_index: 3 };
export function providerFixture() {
  return { timezone: 'Asia/Manila', hourly: { time: ['2026-10-18T12:00'], ...Object.fromEntries(FORECAST_FIELDS.map(field => [field, [field === 'temperature_2m' ? 28 : field === 'visibility' ? 10000 : 0]])) } };
}
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); clearCache(); sessionStorage.clear(); });
describe('production weather integrity rules', () => {
  it.each([{ wind_speed: 80 }, { wind_gusts: 90 }, { precipitation: 20 }, { weather_code: 95 }, { visibility: 0 }])('critical hazard overrides favorable averages: %o', change => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ ...base, hour: i, ...(i === 12 ? change : {}) }));
    expect(computeVerdict(hours)?.verdict).toBe('NO-GO');
    expect(computeVerdict(hours)?.summary).toContain('Road conditions are not verified');
  });
  it('preserves zero visibility and refuses missing inputs', () => {
    expect(computeVerdict([{ ...base, visibility: 0 }])?.metrics.avgVisibility).toBe(0);
    for (const field of ['visibility', 'wind_speed', 'precipitation', 'wind_gusts']) expect(computeVerdict([{ ...base, [field]: null } as unknown as HourlyData])).toBeNull();
    expect(computeVerdict([])).toBeNull();
  });
  it('does not recommend a critical-hazard hour as a best window', () => {
    const result = findTravelWindows([base, { ...base, wind_speed: 80 }, base]);
    expect(result.allBad).toBe(true);
  });
  it('validates provider payloads and preserves real zero values', () => {
    const good = providerFixture();
    expect(parseForecast(good).hourly[0].precipitation).toBe(0);
    expect(parseForecast(good).hourly[0].visibility).toBe(10000);
    for (const field of FORECAST_FIELDS) {
      expect(() => parseForecast({ ...good, hourly: { ...good.hourly, [field]: [null] } })).toThrow(/unavailable/);
    }
    expect(() => parseForecast({})).toThrow(/unavailable/);
    expect(() => parseForecast({ ...good, timezone: 'UTC' })).toThrow();
  });
  it('uses Manila date and hour across UTC boundaries', () => {
    const now = new Date('2026-10-17T16:30:00Z');
    expect(manilaDate(now)).toBe('2026-10-18');
    expect(manilaHour(now)).toBe(0);
    expect(currentForecastIndex([{ time: '2026-10-17T23:00' }, { time: '2026-10-18T00:00' }], now.getTime())).toBe(1);
  });
  it('expires memory and persistent cache, including legacy entries', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-18T00:00:00Z'));
    setCache('test', { rain: 0 });
    expect(getCached('test')).toEqual({ rain: 0 });
    vi.advanceTimersByTime(CACHE_DURATION);
    expect(getCached('test', true)).toBeNull();
    localStorage.setItem('ph-rain-cache-old', JSON.stringify({ data: { rain: 0 }, timestamp: Date.now() - 86400000 }));
    expect(getCached('old', true)).toBeNull();
  });
  it('renders official links without invented bulletin metadata or a share-warning control', () => {
    render(<WeatherSignalPanel region="NCR" />);
    expect(screen.getByText(/does not ingest official warnings/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tropical cyclone bulletins/ })).toHaveAttribute('href', 'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin');
    expect(screen.queryByRole('button', { name: /share.*warning/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/valid until|issued at/i)).not.toBeInTheDocument();
  });
  it('labels mapped facilities as operationally unverified', () => {
    mocks.facilities.mockReturnValue({ loading: false, error: null, centers: [], searchRadius: 5 });
    render(<EvacuationPanel lat={14} lon={121} region="NCR" />);
    expect(screen.getByText(/not verified operational evacuation centers/)).toBeInTheDocument();
    expect(screen.getByText(/selected forecast point/)).toBeInTheDocument();
  });
  it('requests Makati coordinates even when the dashboard is already NCR', () => {
    mocks.weather.mockReturnValue({ hourly: [], daily: [], loading: false, error: null, refetch: vi.fn() });
    render(<TripGoChecker region="NCR" hourly={[]} daily={[]} />);
    fireEvent.change(screen.getByLabelText('Where are you going?'), { target: { value: 'NCR' } });
    fireEvent.change(screen.getByLabelText('City (optional)'), { target: { value: 'Makati' } });
    const last = mocks.weather.mock.calls[mocks.weather.mock.calls.length - 1]!;
    expect(last[0]).toBe('NCR');
    expect(last[1]).toEqual(expect.objectContaining({ lat: expect.any(Number), lon: expect.any(Number) }));
    expect(last[1].lat).toBeCloseTo(14.5547);
  });
});
