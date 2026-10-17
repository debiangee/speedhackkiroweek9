import type { Page } from '@playwright/test';
export const TEST_TIME = new Date('2026-10-18T04:30:00Z');
export function forecastFixture(url: string) {
  const parsed = new URL(url);
  const variables = (parsed.searchParams.get('hourly') || '').split(',');
  const city = Math.abs(Number(parsed.searchParams.get('latitude')) - 14.5547) < .001;
  const values: Record<string, number> = { temperature_2m: city ? 31 : 27, relative_humidity_2m: 70, dew_point_2m: 22, precipitation: .2, precipitation_probability: 25, wind_speed_10m: 12, wind_gusts_10m: 20, weather_code: 2, cloud_cover: 40, visibility: 12000, uv_index: 4, apparent_temperature: 30, rain: .2, showers: 0, wind_direction_10m: 90, surface_pressure: 1010 };
  const time = Array.from({ length: 168 }, (_, i) => `2026-10-${String(18 + Math.floor(i / 24)).padStart(2,'0')}T${String(i % 24).padStart(2,'0')}:00`);
  return { timezone: 'Asia/Manila', hourly: { time, ...Object.fromEntries(variables.map(v => [v, time.map(() => values[v] ?? 0)])) } };
}
export async function prepare(page: Page) {
  await page.clock.setFixedTime(TEST_TIME);
  await page.route('https://**/*', async route => {
    const url = route.request().url();
    if (url.startsWith('https://api.open-meteo.com/')) return route.fulfill({ json: forecastFixture(url) });
    if (url.includes('overpass-api.de/')) return route.fulfill({ json: { elements: [] } });
    if (url.includes('air-quality-api.open-meteo.com/')) return route.fulfill({ json: { hourly: {time: [], us_aqi: []} } });
    if (url.includes('archive-api.open-meteo.com/')) return route.fulfill({ json: {daily: {time: ['2025-10-18'], precipitation_sum: [1], temperature_2m_mean: [27]} } });
    return route.abort();
  });
}
