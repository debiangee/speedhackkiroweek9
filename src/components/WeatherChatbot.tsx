import { manilaDate, manilaHour } from '../utils/time';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  MapPinIcon,
  ThermometerIcon,
  DropletIcon,
  WindIcon,
  EyeIcon,
  AlertTriangleIcon,
  CloudSunIcon,
  SunIcon,
  CloudRainIcon,
  CloudLightningIcon,
  LightbulbIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  CarIcon,
  MotorcycleIcon,
  BusIcon,
  WalkingIcon,
  ShieldIcon,
  WavesIcon,
  UmbrellaIcon,
  StarIcon,
  CloudIcon,
  SparklesIcon,
} from './Icons';
import './WeatherChatbot.css';

// Region coordinates for direct API fetching
const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'NCR': { lat: 14.5995, lon: 120.9842 },
  'CAR': { lat: 16.4023, lon: 120.596 },
  'Ilocos': { lat: 17.5747, lon: 120.3869 },
  'Cagayan Valley': { lat: 17.6132, lon: 121.727 },
  'Central Luzon': { lat: 15.145, lon: 120.5887 },
  'CALABARZON': { lat: 14.1, lon: 121.3 },
  'MIMAROPA': { lat: 9.7392, lon: 118.7353 },
  'Bicol': { lat: 13.1391, lon: 123.7438 },
  'Western Visayas': { lat: 10.7202, lon: 122.5621 },
  'Central Visayas': { lat: 10.3157, lon: 123.8854 },
  'Eastern Visayas': { lat: 11.25, lon: 125.0 },
  'Zamboanga Peninsula': { lat: 6.9214, lon: 122.079 },
  'Northern Mindanao': { lat: 8.4542, lon: 124.6319 },
  'Davao': { lat: 7.1907, lon: 125.4553 },
  'SOCCSKSARGEN': { lat: 6.5, lon: 124.85 },
  'Caraga': { lat: 8.9475, lon: 125.5406 },
  'BARMM': { lat: 7.2, lon: 124.23 },
};

// Aliases so users can type casually
const REGION_ALIASES: Record<string, string> = {
  'manila': 'NCR', 'metro manila': 'NCR', 'makati': 'NCR',
  'quezon city': 'NCR', 'qc': 'NCR', 'taguig': 'NCR', 'pasig': 'NCR',
  'mandaluyong': 'NCR', 'bgc': 'NCR', 'ortigas': 'NCR',
  'baguio': 'CAR', 'cordillera': 'CAR', 'benguet': 'CAR',
  'ilocos': 'Ilocos', 'vigan': 'Ilocos', 'laoag': 'Ilocos', 'pangasinan': 'Ilocos',
  'cagayan': 'Cagayan Valley', 'tuguegarao': 'Cagayan Valley', 'isabela': 'Cagayan Valley',
  'pampanga': 'Central Luzon', 'tarlac': 'Central Luzon', 'clark': 'Central Luzon',
  'bulacan': 'Central Luzon', 'nueva ecija': 'Central Luzon', 'zambales': 'Central Luzon',
  'calabarzon': 'CALABARZON', 'cavite': 'CALABARZON', 'laguna': 'CALABARZON',
  'batangas': 'CALABARZON', 'tagaytay': 'CALABARZON', 'rizal': 'CALABARZON',
  'antipolo': 'CALABARZON', 'lucena': 'CALABARZON',
  'mimaropa': 'MIMAROPA', 'palawan': 'MIMAROPA', 'puerto princesa': 'MIMAROPA',
  'mindoro': 'MIMAROPA', 'calapan': 'MIMAROPA', 'el nido': 'MIMAROPA',
  'bicol': 'Bicol', 'naga': 'Bicol', 'legazpi': 'Bicol', 'albay': 'Bicol',
  'sorsogon': 'Bicol', 'mayon': 'Bicol', 'camarines': 'Bicol',
  'iloilo': 'Western Visayas', 'bacolod': 'Western Visayas', 'western visayas': 'Western Visayas',
  'boracay': 'Western Visayas', 'aklan': 'Western Visayas', 'negros occidental': 'Western Visayas',
  'cebu': 'Central Visayas', 'bohol': 'Central Visayas', 'central visayas': 'Central Visayas',
  'mactan': 'Central Visayas', 'lapu-lapu': 'Central Visayas', 'dumaguete': 'Central Visayas',
  'tacloban': 'Eastern Visayas', 'leyte': 'Eastern Visayas', 'samar': 'Eastern Visayas',
  'eastern visayas': 'Eastern Visayas', 'ormoc': 'Eastern Visayas',
  'zamboanga': 'Zamboanga Peninsula', 'zamboanga city': 'Zamboanga Peninsula',
  'cdo': 'Northern Mindanao', 'cagayan de oro': 'Northern Mindanao',
  'northern mindanao': 'Northern Mindanao', 'iligan': 'Northern Mindanao',
  'bukidnon': 'Northern Mindanao',
  'davao': 'Davao', 'davao city': 'Davao', 'digos': 'Davao', 'tagum': 'Davao',
  'general santos': 'SOCCSKSARGEN', 'gensan': 'SOCCSKSARGEN', 'soccsksargen': 'SOCCSKSARGEN',
  'koronadal': 'SOCCSKSARGEN', 'south cotabato': 'SOCCSKSARGEN',
  'caraga': 'Caraga', 'butuan': 'Caraga', 'surigao': 'Caraga', 'agusan': 'Caraga',
  'barmm': 'BARMM', 'cotabato': 'BARMM', 'marawi': 'BARMM',
  'lanao': 'BARMM', 'maguindanao': 'BARMM',
};

interface RealityAction {
  region: string;
  hourOffset?: number;
  label: string;
}

interface Message {
  role: 'bot' | 'user';
  text: string;
  followUps?: string[];
  realityAction?: RealityAction;
}

// Extended hourly entry with all signals needed for accurate prediction
interface HourlyEntry {
  time: string;
  temperature: number;
  apparent_temperature: number;
  humidity: number;
  dew_point: number;
  precipitation: number;
  precipitation_probability: number;
  rain: number;
  showers: number;
  wind_speed: number;
  wind_gusts: number;
  wind_direction: number;
  cloud_cover: number;
  visibility: number;
  surface_pressure: number;
  weather_code: number;
}

// WMO Weather Code interpretation (standard codes used by Open-Meteo)
// Source: https://open-meteo.com/en/docs (WMO code table 4677)
function interpretWeatherCode(code: number): { description: string; severity: number } {
  if (code === 0) return { description: 'Clear sky', severity: 0 };
  if (code <= 3) return { description: 'Partly cloudy', severity: 0 };
  if (code >= 45 && code <= 48) return { description: 'Foggy', severity: 1 };
  if (code >= 51 && code <= 55) return { description: 'Drizzle', severity: 1 };
  if (code >= 56 && code <= 57) return { description: 'Freezing drizzle', severity: 2 };
  if (code >= 61 && code <= 63) return { description: 'Rain', severity: 2 };
  if (code === 65) return { description: 'Heavy rain', severity: 3 };
  if (code >= 66 && code <= 67) return { description: 'Freezing rain', severity: 3 };
  if (code >= 71 && code <= 77) return { description: 'Snow', severity: 2 };
  if (code >= 80 && code <= 82) return { description: 'Rain showers', severity: 2 };
  if (code >= 85 && code <= 86) return { description: 'Snow showers', severity: 2 };
  if (code === 95) return { description: 'Thunderstorm', severity: 3 };
  if (code >= 96 && code <= 99) return { description: 'Thunderstorm with hail', severity: 4 };
  return { description: 'Unknown', severity: 0 };
}

// Philippine Heat Index calculation (Steadman formula adapted for tropical humidity)
// This is critical — in PH, 32°C with 80% humidity FEELS like 42°C
function calculateHeatIndex(tempC: number, humidity: number): number {
  if (tempC < 27) return tempC; // Heat index only meaningful above 27°C in tropics

  // Rothfusz regression (converted to Celsius)
  const T = tempC * 9 / 5 + 32; // Convert to Fahrenheit for formula
  const RH = humidity;

  let HI = -42.379 + 2.04901523 * T + 10.14333127 * RH
    - 0.22475541 * T * RH - 0.00683783 * T * T
    - 0.05481717 * RH * RH + 0.00122874 * T * T * RH
    + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;

  // Adjustments
  if (RH < 13 && T >= 80 && T <= 112) {
    HI -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  } else if (RH > 85 && T >= 80 && T <= 87) {
    HI += ((RH - 85) / 10) * ((87 - T) / 5);
  }

  return Math.round(((HI - 32) * 5 / 9) * 10) / 10; // Back to Celsius
}

// Detect rapid pressure drops — key typhoon/severe weather signal
function detectPressureDrop(data: HourlyEntry[], currentIdx: number): { dropping: boolean; rate: number } {
  if (currentIdx < 3) return { dropping: false, rate: 0 };
  const current = data[currentIdx].surface_pressure;
  const threeHoursAgo = data[currentIdx - 3].surface_pressure;
  const rate = threeHoursAgo - current; // Positive = pressure dropping
  return { dropping: rate > 2, rate: Math.round(rate * 10) / 10 };
}

// Find contiguous dry windows (proper algorithm)
function findBestDryWindow(data: HourlyEntry[]): { start: number; end: number; hours: number } | null {
  if (data.length < 2) return null;

  let bestStart = -1, bestLen = 0;
  let curStart = -1, curLen = 0;

  for (let i = 0; i < data.length; i++) {
    const isDry = data[i].precipitation < 0.3 && data[i].precipitation_probability < 30
      && data[i].wind_gusts < 40 && data[i].visibility > 3000;

    if (isDry) {
      if (curStart === -1) curStart = i;
      curLen++;
    } else {
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
      curStart = -1;
      curLen = 0;
    }
  }
  if (curLen > bestLen) {
    bestStart = curStart;
    bestLen = curLen;
  }

  if (bestStart === -1 || bestLen < 2) return null;

  const startHour = parseInt(data[bestStart].time.split('T')[1]) || 0;
  const endHour = parseInt(data[bestStart + bestLen - 1].time.split('T')[1]) || 0;

  return {
    start: startHour,
    end: endHour,
    hours: bestLen,
  };
}

// Compute composite "danger score" from multiple signals
function computeDangerScore(entry: HourlyEntry): number {
  let score = 0;
  // Rain intensity
  if (entry.precipitation > 20) score += 4;
  else if (entry.precipitation > 10) score += 3;
  else if (entry.precipitation > 5) score += 2;
  else if (entry.precipitation > 1) score += 1;

  // Wind gusts (tropical storm: 63+ km/h, typhoon: 118+ km/h)
  if (entry.wind_gusts > 118) score += 5;
  else if (entry.wind_gusts > 89) score += 4;
  else if (entry.wind_gusts > 63) score += 3;
  else if (entry.wind_gusts > 40) score += 2;
  else if (entry.wind_gusts > 25) score += 1;

  // Visibility (< 1km is dangerous)
  if (entry.visibility < 500) score += 3;
  else if (entry.visibility < 1000) score += 2;
  else if (entry.visibility < 3000) score += 1;

  // Weather code severity
  const { severity } = interpretWeatherCode(entry.weather_code);
  score += severity;

  return score;
}

// Flood risk assessment based on accumulated rain

function getGreeting(): string {
  const hour = manilaHour();
  if (hour < 12) return 'Magandang umaga, pre!';
  if (hour < 18) return 'Magandang hapon, tol!';
  return 'Magandang gabi, pare!';
}

function getHeatIndexWarning(hi: number): string {
  if (hi >= 52) return '[!] EXTREME DANGER! Heatstroke imminent. Wag lumabas!';
  if (hi >= 42) return '[!] DANGER! Heatstroke possible. Limitahan ang outdoor activity!';
  if (hi >= 33) return '[!] Mainit-init! Uminom ng maraming tubig at maghanap ng lilim.';
  return '';
}

function fmtTime(h: number): string {
  if (h === 0) return '12AM';
  if (h === 12) return '12PM';
  return h > 12 ? `${h - 12}PM` : `${h}AM`;
}

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function detectRegion(text: string): string | null {
  const lower = text.toLowerCase();
  // Check aliases first (longest match first to avoid false positives)
  const sortedAliases = Object.entries(REGION_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, region] of sortedAliases) {
    if (lower.includes(alias)) return region;
  }
  for (const region of Object.keys(REGION_COORDS)) {
    if (lower.includes(region.toLowerCase())) return region;
  }
  return null;
}

function detectIntent(text: string): 'weather_now' | 'forecast' | 'rain' | 'travel' | 'flood' | 'heat' | 'compare' | 'general' {
  const lower = text.toLowerCase();
  if (lower.match(/\b(init|mainit|heat|heat index|temperature|temp|feels like)\b/)) return 'heat';
  if (lower.match(/\b(baha|flood|tubig|anegado|lumubog)\b/)) return 'flood';
  if (lower.match(/\b(ngayon|now|current|today|panahon ngayon|weather now)\b/)) return 'weather_now';
  if (lower.match(/\b(bukas|tomorrow|next|week|forecast|susunod|linggo)\b/)) return 'forecast';
  if (lower.match(/\b(ulan|rain|uulan|bagyo|typhoon|storm|ambon|drizzle)\b/)) return 'rain';
  if (lower.match(/\b(travel|byahe|lakad|labas|pupunta|punta|go|safe|okay ba|commute|drive|motor|ride)\b/)) return 'travel';
  if (lower.match(/\b(compare|vs|kumpara|which|alin|saan mas)\b/)) return 'compare';
  return 'general';
}

// In-memory cache: 10-minute TTL per region to avoid redundant API calls
const weatherCache: Map<string, { data: HourlyEntry[]; timestamp: number }> = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchWeatherForRegion(region: string): Promise<HourlyEntry[] | null> {
  const coords = REGION_COORDS[region];
  if (!coords) return null;

  // Check cache first
  const cacheKey = `${coords.lat}-${coords.lon}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch comprehensive weather signals for accurate prediction
    const params = [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'dew_point_2m',
      'precipitation',
      'precipitation_probability',
      'rain',
      'showers',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'cloud_cover',
      'visibility',
      'surface_pressure',
      'weather_code',
    ].join(',');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=${params}&timezone=Asia/Manila&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.hourly || !Array.isArray(data.hourly.time) || !data.hourly.time.length) return null;
    for (const field of params.split(',')) {
      if (!Array.isArray(data.hourly[field]) || data.hourly[field].length !== data.hourly.time.length || data.hourly[field].some((v: unknown) => typeof v !== 'number' || !Number.isFinite(v))) return null;
    }

    const entries: HourlyEntry[] = [];
    for (let i = 0; i < data.hourly.time.length; i++) {
      entries.push({
        time: data.hourly.time[i] ?? '',
        temperature: data.hourly.temperature_2m?.[i] ?? 0,
        apparent_temperature: data.hourly.apparent_temperature?.[i] ?? 0,
        humidity: data.hourly.relative_humidity_2m?.[i] ?? 0,
        dew_point: data.hourly.dew_point_2m?.[i] ?? 0,
        precipitation: data.hourly.precipitation?.[i] ?? 0,
        precipitation_probability: data.hourly.precipitation_probability?.[i] ?? 0,
        rain: data.hourly.rain?.[i] ?? 0,
        showers: data.hourly.showers?.[i] ?? 0,
        wind_speed: data.hourly.wind_speed_10m?.[i] ?? 0,
        wind_gusts: data.hourly.wind_gusts_10m?.[i] ?? 0,
        wind_direction: data.hourly.wind_direction_10m?.[i] ?? 0,
        cloud_cover: data.hourly.cloud_cover?.[i] ?? 0,
        visibility: data.hourly.visibility?.[i] ?? 10000,
        surface_pressure: data.hourly.surface_pressure?.[i] ?? 1013,
        weather_code: data.hourly.weather_code?.[i] ?? 0,
      });
    }

    // Store in cache
    weatherCache.set(cacheKey, { data: entries, timestamp: Date.now() });

    // Prune old cache entries (keep max 10)
    if (weatherCache.size > 10) {
      const oldest = [...weatherCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) weatherCache.delete(oldest[0]);
    }

    return entries;
  } catch {
    // Return stale cache if available on network error
    // Expired forecasts are never silently reused.
    return null;
  }
}

function buildCurrentResponse(region: string, data: HourlyEntry[]): string {
  const now = new Date();
  const currentHour = manilaHour(now);
  const todayStr = manilaDate(now);

  const currentIdx = data.findIndex(
    (d) => d.time.startsWith(todayStr) && parseInt(d.time.split('T')[1]) === currentHour
  );
  const current = currentIdx >= 0 ? data[currentIdx] : null;

  if (!current) return `😅 Ay, walang data ngayon para sa ${region}. Try mo ulit mamaya, tol!`;

  const heatIndex = calculateHeatIndex(current.temperature, current.humidity);
  const hiWarning = getHeatIndexWarning(heatIndex);
  const { description: weatherDesc } = interpretWeatherCode(current.weather_code);
  const pressureDrop = detectPressureDrop(data, currentIdx);
  const dangerScore = computeDangerScore(current);
  const windDir = windDirectionLabel(current.wind_direction);

  // Look ahead 3 hours for incoming weather
  const next3h = data.slice(currentIdx + 1, currentIdx + 4);
  const incomingRain = next3h.some(h => h.precipitation_probability > 60 || h.precipitation > 2);

  // Weather condition emoji
  const weatherEmoji = current.weather_code === 0 ? '☀️' :
    current.weather_code <= 3 ? '⛅' :
    current.weather_code >= 95 ? '⛈️' :
    current.weather_code >= 61 ? '🌧️' :
    current.weather_code >= 51 ? '🌦️' :
    current.weather_code >= 45 ? '🌫️' : '🌤️';

  let response = `📍 **${region}** • ${fmtTime(currentHour)}\n`;
  response += `${weatherEmoji} ${weatherDesc}\n`;
  response += `\n`;
  response += `🌡️ **Temperature**\n`;
  response += `  ${current.temperature}°C  •  Feels like ${heatIndex}°C\n`;
  response += `\n`;
  response += `💧 **Rain & Humidity**\n`;
  response += `  ${current.precipitation}mm rainfall  •  ${current.precipitation_probability}% chance\n`;
  response += `  Humidity ${current.humidity}%  •  Dew point ${current.dew_point}°C\n`;
  response += `\n`;
  response += `💨 **Wind**\n`;
  response += `  ${current.wind_speed} km/h ${windDir}  •  Gusts ${current.wind_gusts} km/h\n`;
  response += `\n`;
  response += `👁️ **Visibility & Sky**\n`;
  response += `  ${(current.visibility / 1000).toFixed(1)} km  •  Clouds ${current.cloud_cover}%\n`;
  response += `  Pressure ${current.surface_pressure} hPa`;

  // Alerts section
  const alerts: string[] = [];
  if (hiWarning) alerts.push(hiWarning);
  if (pressureDrop.dropping) {
    alerts.push(`📉 Bumababa ang pressure! (-${pressureDrop.rate} hPa/3hrs) — possible severe weather incoming!`);
  }
  if (dangerScore >= 5) {
    alerts.push(`🚨 DANGER LEVEL: High! Iwasan ang unnecessary travel.`);
  } else if (dangerScore >= 3) {
    alerts.push(`⚠️ Caution: Risky conditions outside.`);
  }
  if (incomingRain && current.precipitation < 1) {
    alerts.push(`🌧️ Heads up! Papalapit ang ulan sa susunod na 3 hours!`);
  }
  if (current.visibility < 2000) {
    alerts.push(`🌫️ Low visibility (${(current.visibility / 1000).toFixed(1)}km) — ingat sa pagmamaneho!`);
  }

  if (alerts.length > 0) {
    response += `\n\n⚠️ **Alerts**\n`;
    response += alerts.map(a => `  ${a}`).join('\n');
  } else {
    // Give a vibe check
    if (current.precipitation < 0.5 && current.wind_speed < 20 && heatIndex < 35) {
      response += `\n\n✅ Maganda ang panahon! Good vibes, tol!`;
    } else if (heatIndex >= 35) {
      response += `\n\n🥵 Ang init pre! Hydrate ka palagi!`;
    } else {
      response += `\n\n☂️ Dala ka lang ng payong, just in case!`;
    }
  }

  return response;
}

function buildForecastResponse(region: string, data: HourlyEntry[]): string {
  const now = new Date();
  const days: Record<string, HourlyEntry[]> = {};

  for (const entry of data) {
    const date = entry.time.split('T')[0];
    if (!days[date]) days[date] = [];
    days[date].push(entry);
  }

  const sortedDays = Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).slice(0, 7);

  if (sortedDays.length === 0) {
    return `😅 Walang forecast data para sa ${region}. Try mo ulit mamaya, tol!`;
  }

  let response = `📅 **7-Day Forecast** — ${region}\n\n`;

  for (const [date, hours] of sortedDays) {
    if (hours.length === 0) continue;

    const d = new Date(date + 'T00:00:00');
    const isToday = date === manilaDate(now);
    const dayLabel = isToday ? 'Today' : d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });

    const temps = hours.map(h => h.temperature);
    const minTemp = Math.round(Math.min(...temps));
    const maxTemp = Math.round(Math.max(...temps));
    const totalRain = Math.round(hours.reduce((s, h) => s + h.precipitation, 0) * 10) / 10;
    const maxProb = Math.max(...hours.map(h => h.precipitation_probability));
    const maxGusts = Math.max(...hours.map(h => h.wind_gusts));
    const worstCode = Math.max(...hours.map(h => h.weather_code));
    const { description } = interpretWeatherCode(worstCode);

    // Weather condition emoji per day
    const dayEmoji = worstCode === 0 ? '☀️' :
      worstCode <= 3 ? '⛅' :
      worstCode >= 95 ? '⛈️' :
      worstCode >= 61 ? '🌧️' :
      worstCode >= 51 ? '🌦️' :
      worstCode >= 45 ? '🌫️' : '🌤️';

    // Peak heat index during daytime (10AM-4PM)
    const daytime = hours.filter(h => {
      const hr = parseInt(h.time.split('T')[1]);
      return hr >= 10 && hr <= 16;
    });
    const peakHI = daytime.length > 0
      ? Math.max(...daytime.map(h => calculateHeatIndex(h.temperature, h.humidity)))
      : 0;

    let line = `${dayEmoji} **${dayLabel}**\n`;
    line += `  ${minTemp}–${maxTemp}°C`;
    if (peakHI >= 35) line += `  •  HI ${peakHI}°C 🥵`;
    line += `\n`;
    line += `  💧 ${totalRain}mm (${maxProb}%)`;
    if (maxGusts > 50) line += `  •  💨 ${Math.round(maxGusts)}km/h`;
    line += `  •  ${description}`;
    response += line + '\n\n';
  }

  // Week summary with flood assessment
  const allData = sortedDays.flatMap(([, h]) => h);
  const totalWeekRain = allData.reduce((s, h) => s + h.precipitation, 0);
  const stormDays = sortedDays.filter(([, h]) => h.some(x => x.weather_code >= 95)).length;

  response += `───────────────\n`;
  response += `📊 **Week Summary**\n`;
  if (stormDays > 0) {
    response += `⛈️ ${stormDays} day(s) may thunderstorm\n`;
  }
  if (totalWeekRain > 100) {
    response += `🚨 Sobrang dami ng ulan (${Math.round(totalWeekRain)}mm)! Mag-ingat sa baha!`;
  } else if (totalWeekRain > 50) {
    response += `☂️ Maulan ang week (${Math.round(totalWeekRain)}mm). Laging dala ang payong!`;
  } else if (totalWeekRain < 5) {
    response += `☀️ Dry week ahead! Enjoy, fam!`;
  } else {
    response += `🌤️ Mixed weather. May ulan, may araw. Preparado lang lagi!`;
  }

  return response;
}

function buildRainResponse(region: string, data: HourlyEntry[]): string {
  const now = new Date();
  const todayStr = manilaDate(now);
  const todayData = data.filter((d) => d.time.startsWith(todayStr));

  if (todayData.length === 0) {
    return `😅 Walang rain data para sa ${region} ngayon. Try mo ulit mamaya, tol!`;
  }

  const totalRain = todayData.reduce((sum, d) => sum + d.precipitation, 0);
  const totalShowers = todayData.reduce((sum, d) => sum + d.showers, 0);
  const maxProb = Math.max(...todayData.map((d) => d.precipitation_probability));
  const rainyHours = todayData.filter((d) => d.precipitation > 0.5);
  const thunderHours = todayData.filter(d => d.weather_code >= 95);

  let response = `🌧️ **Rain Report** — ${region}\n\n`;

  response += `📊 **Overview**\n`;
  response += `  Total rainfall: ${Math.round(totalRain * 10) / 10}mm\n`;
  response += `  Showers: ${Math.round(totalShowers * 10) / 10}mm\n`;
  response += `  Max chance: ${maxProb}%\n`;
  response += `  Rainy hours: ${rainyHours.length} of 24\n`;
  if (thunderHours.length > 0) {
    response += `  ⛈️ Thunder expected: ${thunderHours.length} hour(s)\n`;
  }

  // Peak rain analysis
  if (rainyHours.length > 0) {
    const peakHour = rainyHours.reduce((prev, curr) =>
      curr.precipitation > prev.precipitation ? curr : prev
    );
    const peakTime = parseInt(peakHour.time.split('T')[1]);
    response += `\n⏱️ **Peak Rain**\n`;
    response += `  ${fmtTime(peakTime)} — ${peakHour.precipitation}mm, gusts ${peakHour.wind_gusts}km/h\n`;

    // Rain timing pattern
    const morningRain = todayData.filter(d => {
      const h = parseInt(d.time.split('T')[1]);
      return h >= 6 && h < 12 && d.precipitation > 0.5;
    }).length;
    const afternoonRain = todayData.filter(d => {
      const h = parseInt(d.time.split('T')[1]);
      return h >= 12 && h < 18 && d.precipitation > 0.5;
    }).length;
    const eveningRain = todayData.filter(d => {
      const h = parseInt(d.time.split('T')[1]);
      return h >= 18 && d.precipitation > 0.5;
    }).length;

    response += `\n🕐 **When It Rains**\n`;
    response += `  🌅 Morning (6AM–12PM):  ${morningRain > 0 ? `${morningRain}hrs 🌧️` : 'Dry ✓'}\n`;
    response += `  ☀️ Afternoon (12–6PM):  ${afternoonRain > 0 ? `${afternoonRain}hrs 🌧️` : 'Dry ✓'}\n`;
    response += `  🌙 Evening (6PM+):      ${eveningRain > 0 ? `${eveningRain}hrs 🌧️` : 'Dry ✓'}\n`;
  }

  // Flood risk assessment
  response += '\nFlood conditions unknown. Consult PAGASA and local DRRMO/LGU information.';

  return response;
}

function buildTravelResponse(region: string, data: HourlyEntry[]): string {
  const now = new Date();
  const todayStr = manilaDate(now);
  const todayData = data.filter((d) => d.time.startsWith(todayStr));
  const currentHour = manilaHour(now);
  const remaining = todayData.filter((d) => parseInt(d.time.split('T')[1]) >= currentHour);

  if (remaining.length === 0) {
    return `😅 Wala nang data para sa remaining hours ngayon sa ${region}. Check mo na lang ang bukas, tol!`;
  }

  // Compute composite danger scores
  const dangerScores = remaining.map(d => computeDangerScore(d));
  const maxDanger = Math.max(...dangerScores);
  const avgDanger = dangerScores.reduce((a, b) => a + b, 0) / dangerScores.length;

  const maxWind = Math.max(...remaining.map(d => d.wind_speed));
  const maxGusts = Math.max(...remaining.map(d => d.wind_gusts));
  const maxRainProb = Math.max(...remaining.map(d => d.precipitation_probability));
  const totalRain = remaining.reduce((s, d) => s + d.precipitation, 0);
  const minVisibility = Math.min(...remaining.map(d => d.visibility));
  const hasThunder = remaining.some(d => d.weather_code >= 95);

  // Pressure trend (falling pressure = worsening weather)
  const pressures = remaining.map(d => d.surface_pressure);
  const pressureTrend = pressures.length > 3 ? pressures[0] - pressures[pressures.length - 1] : 0;

  // Multi-factor verdict
  let verdict: string;
  let verdictEmoji: string;
  let safetyLevel: number; // 1-5

  if (maxDanger >= 7 || maxGusts > 90 || hasThunder) {
    verdict = 'DELIKADO! Huwag lumabas kung hindi emergency.';
    verdictEmoji = '🚫';
    safetyLevel = 1;
  } else if (maxDanger >= 5 || maxGusts > 60 || totalRain > 15) {
    verdict = 'Hindi advisable ang travel. Malakas na ulan at hangin.';
    verdictEmoji = '🚨';
    safetyLevel = 2;
  } else if (avgDanger >= 3 || maxRainProb > 70 || minVisibility < 2000) {
    verdict = 'Pwede, pero extra ingat. Dala payong at drive slow!';
    verdictEmoji = '⚠️';
    safetyLevel = 3;
  } else if (maxRainProb > 40 || pressureTrend > 2) {
    verdict = 'Medyo risky mamaya. Dala payong just in case!';
    verdictEmoji = '☁️';
    safetyLevel = 3;
  } else {
    verdict = 'Lower forecast disruption; road safety remains unknown.';
    verdictEmoji = '✅';
    safetyLevel = 5;
  }

  let response = `🚗 **Travel Advisory** — ${region}\n\n`;
  response += `${verdictEmoji} **${verdict}**\n\n`;

  response += `📊 **Conditions Ahead**\n`;
  response += `  🌧️ Rain: up to ${maxRainProb}% chance, ${Math.round(totalRain * 10) / 10}mm total\n`;
  response += `  💨 Wind: ${maxWind}km/h sustained, gusts ${maxGusts}km/h\n`;
  response += `  👁️ Visibility: ${(minVisibility / 1000).toFixed(1)}km minimum\n`;
  if (hasThunder) response += `  ⛈️ Thunderstorm activity expected!\n`;
  if (pressureTrend > 2) response += `  📉 Pressure dropping — weather worsening\n`;

  // Find best dry window using proper contiguous algorithm
  const bestWindow = findBestDryWindow(remaining);
  if (bestWindow && safetyLevel < 5) {
    response += `\n⏰ **Best Window**\n`;
    response += `  ${fmtTime(bestWindow.start)} – ${fmtTime(bestWindow.end)} (${bestWindow.hours}hrs dry)\n`;
  }

  // Mode-specific advice
  response += `\n🛣️ **By Transport Mode**\n`;
  response += `  🏍️ Motor: ${safetyLevel <= 2 ? 'HUWAG. Delikado talaga.' : safetyLevel <= 3 ? 'Ingat! Slow sa wet roads.' : 'G lang, pare!'}\n`;
  response += `  🚗 Kotse: ${safetyLevel <= 2 ? 'Headlights on, mabagal lang.' : 'Okay naman. Ingat sa baha areas.'}\n`;
  response += `  🚶 Lakad: ${minVisibility < 3000 ? 'Low visibility — mag-ingat.' : safetyLevel >= 4 ? 'Check local walking conditions' : 'Dala payong!'}`;

  return response;
}

function buildHeatResponse(region: string, data: HourlyEntry[]): string {
  const now = new Date();
  const todayStr = manilaDate(now);
  const todayData = data.filter((d) => d.time.startsWith(todayStr));

  if (todayData.length === 0) {
    return `😅 Walang heat index data para sa ${region} ngayon. Try mo ulit mamaya, tol!`;
  }

  // Compute heat index for each hour
  const heatData = todayData.map(d => ({
    hour: parseInt(d.time.split('T')[1]),
    temp: d.temperature,
    humidity: d.humidity,
    heatIndex: calculateHeatIndex(d.temperature, d.humidity),
    feelsLike: d.apparent_temperature,
  }));

  const peakHeat = heatData.reduce((prev, curr) => curr.heatIndex > prev.heatIndex ? curr : prev);
  const currentHour = manilaHour(now);
  const currentData = heatData.find(h => h.hour === currentHour);

  let response = `🌡️ **Heat Report** — ${region}\n\n`;

  if (currentData) {
    response += `📍 **Right Now** (${fmtTime(currentHour)})\n`;
    response += `  🌡️ Temperature: ${currentData.temp}°C\n`;
    response += `  💧 Humidity: ${currentData.humidity}%\n`;
    response += `  🥵 Heat Index: ${currentData.heatIndex}°C\n`;
    response += `  🤒 Feels Like: ${currentData.feelsLike}°C\n\n`;
  }

  response += `🔥 **Peak Heat Today**\n`;
  response += `  ${fmtTime(peakHeat.hour)} — Heat Index ${peakHeat.heatIndex}°C (actual ${peakHeat.temp}°C)\n\n`;

  // PAGASA Heat Index classification
  if (peakHeat.heatIndex >= 52) {
    response += `🚨 **EXTREME DANGER**\n`;
    response += `  Heatstroke highly likely!\n`;
    response += `  Wag lumabas kung hindi kailangan!`;
  } else if (peakHeat.heatIndex >= 42) {
    response += `⚠️ **DANGER**\n`;
    response += `  Sunstroke at muscle cramps likely.\n`;
    response += `  Limitahan ang outdoor activity. Maraming tubig!`;
  } else if (peakHeat.heatIndex >= 33) {
    response += `☀️ **CAUTION**\n`;
    response += `  Fatigue possible with prolonged outdoor activity.\n`;
    response += `  Tubig every 20 mins. Maghanap ng shade!`;
  } else {
    response += `✅ **LOWER HEAT INDICATOR**\n`;
    response += `  Comfortable heat levels.\n`;
    response += `  Enjoy the outdoors pero hydrate pa rin!`;
  }

  // Coolest hours
  const coolest = [...heatData].sort((a, b) => a.heatIndex - b.heatIndex).slice(0, 3);
  response += `\n\n❄️ **Coolest Hours**\n`;
  response += coolest.map(c => `  ${fmtTime(c.hour)} — ${c.heatIndex}°C`).join('\n');

  return response;
}

function buildFloodResponse(region: string, _data: HourlyEntry[]): string {
  return `Flood conditions in ${region} are unknown. Forecast rain alone cannot establish flood risk. Check official PAGASA bulletins and your local DRRMO/LGU. Never cross floodwater.`;
}

function generateFollowUps(intent: ReturnType<typeof detectIntent>, region: string): string[] {
  switch (intent) {
    case 'weather_now':
      return [
        `Uulan ba mamayang hapon sa ${region}?`,
        `Heat index at ramdam na init sa ${region}?`,
        `Safe ba mag-commute / Grab surge ngayon?`,
        `7-day weather forecast sa ${region}`,
      ];
    case 'forecast':
      return [
        `Aling araw ang pinakatuyo (driest day) sa ${region}?`,
        `May malakas na ulan ba ngayong weekend sa ${region}?`,
        `Weather ngayon sa ${region}`,
        `Compare ${region} vs Baguio`,
      ];
    case 'rain':
      return [
        `Kailan titila ang ulan sa ${region}?`,
        `May baha risk ba sa ${region}?`,
        `Anong oras pinakasafe bumiyahe?`,
        `7-day rain outlook sa ${region}`,
      ];
    case 'travel':
      return [
        `Kailan ang best dry window to travel?`,
        `Grab at Angkas fare status ngayon?`,
        `May baha advisory ba sa ${region}?`,
        `Weather forecast bukas sa ${region}`,
      ];
    case 'heat':
      return [
        `Kailan pinakamainit na oras ngayon?`,
        `May ulan ba mamayang gabi sa ${region}?`,
        `Safe ba outdoor activities ngayon?`,
        `Current weather summary sa ${region}`,
      ];
    case 'flood':
      return [
        `Safe ba daanan ang mga kalsada sa ${region}?`,
        `Kailan hihina ang ulan sa ${region}?`,
        `Emergency hotlines sa ${region}`,
        `7-day rain forecast`,
      ];
    case 'compare':
      return [
        `Saan mas safe mag-travel ngayon?`,
        `Uulan ba bukas sa kanila?`,
        `Heat index comparison`,
      ];
    default:
      return [
        `Weather ngayon sa ${region}`,
        `Uulan ba mamaya sa ${region}?`,
        `Heat index sa ${region}`,
        `7-day forecast sa ${region}`,
      ];
  }
}

interface BotResponseResult {
  text: string;
  followUps: string[];
  realityAction?: RealityAction;
}

async function generateBotResponse(userText: string, selectedRegion: string): Promise<BotResponseResult> {
  const detectedRegion = detectRegion(userText) || selectedRegion;
  const intent = detectIntent(userText);

  const data = await fetchWeatherForRegion(detectedRegion);
  if (!data) {
    return {
      text: `Ay sorry, tol! Hindi ko ma-fetch ang weather data para sa ${detectedRegion} ngayon. Baka may internet issue. Try mo ulit!`,
      followUps: [
        `Weather ngayon sa ${selectedRegion}`,
        `Uulan ba sa ${selectedRegion}?`,
      ],
    };
  }

  const followUps = generateFollowUps(intent, detectedRegion);
  const defaultRealityAction: RealityAction = {
    region: detectedRegion,
    label: `Experience ${detectedRegion} Weather`,
  };

  switch (intent) {
    case 'weather_now':
      return {
        text: buildCurrentResponse(detectedRegion, data),
        followUps,
        realityAction: defaultRealityAction,
      };
    case 'forecast':
      return {
        text: buildForecastResponse(detectedRegion, data),
        followUps,
        realityAction: {
          region: detectedRegion,
          hourOffset: 1,
          label: `Experience ${detectedRegion} Forecast`,
        },
      };
    case 'rain':
      return {
        text: buildRainResponse(detectedRegion, data),
        followUps,
        realityAction: defaultRealityAction,
      };
    case 'travel':
      return {
        text: buildTravelResponse(detectedRegion, data),
        followUps,
        realityAction: defaultRealityAction,
      };
    case 'heat':
      return {
        text: buildHeatResponse(detectedRegion, data),
        followUps,
        realityAction: defaultRealityAction,
      };
    case 'flood':
      return {
        text: buildFloodResponse(detectedRegion, data),
        followUps,
        realityAction: defaultRealityAction,
      };
    case 'compare': {
      // Try to find two regions in the query
      const allRegions: string[] = [];
      const lower = userText.toLowerCase();
      const sortedAliases = Object.entries(REGION_ALIASES).sort((a, b) => b[0].length - a[0].length);
      for (const [alias, region] of sortedAliases) {
        if (lower.includes(alias) && !allRegions.includes(region)) {
          allRegions.push(region);
        }
      }
      for (const region of Object.keys(REGION_COORDS)) {
        if (lower.includes(region.toLowerCase()) && !allRegions.includes(region)) {
          allRegions.push(region);
        }
      }

      if (allRegions.length >= 2) {
        const regionA = allRegions[0];
        const regionB = allRegions[1];

        // Fetch fresh data for both regions to avoid mismatch with detectedRegion
        const dataA = regionA === detectedRegion ? data : await fetchWeatherForRegion(regionA);
        const dataB = await fetchWeatherForRegion(regionB);

        if (dataA && dataB) {
          const now = new Date();
          const todayStr = manilaDate(now);
          const currentHour = manilaHour(now);

          const getCurrent = (d: HourlyEntry[]) =>
            d.find((e) => e.time.startsWith(todayStr) && parseInt(e.time.split('T')[1]) === currentHour);

          const a = getCurrent(dataA);
          const b = getCurrent(dataB);

          if (a && b) {
            const hiA = calculateHeatIndex(a.temperature, a.humidity);
            const hiB = calculateHeatIndex(b.temperature, b.humidity);
            const dangerA = computeDangerScore(a);
            const dangerB = computeDangerScore(b);

            let response = `⚔️ **${regionA} vs ${regionB}**\n\n`;

            response += `🌡️ **Temperature**\n`;
            response += `  ${regionA}: ${a.temperature}°C (HI ${hiA}°C)\n`;
            response += `  ${regionB}: ${b.temperature}°C (HI ${hiB}°C)\n\n`;

            response += `🌧️ **Rain**\n`;
            response += `  ${regionA}: ${a.precipitation}mm (${a.precipitation_probability}%)\n`;
            response += `  ${regionB}: ${b.precipitation}mm (${b.precipitation_probability}%)\n\n`;

            response += `💨 **Wind**\n`;
            response += `  ${regionA}: ${a.wind_speed} km/h, gusts ${a.wind_gusts}\n`;
            response += `  ${regionB}: ${b.wind_speed} km/h, gusts ${b.wind_gusts}\n\n`;

            response += `👁️ **Visibility**\n`;
            response += `  ${regionA}: ${(a.visibility / 1000).toFixed(1)}km  •  Clouds ${a.cloud_cover}%\n`;
            response += `  ${regionB}: ${(b.visibility / 1000).toFixed(1)}km  •  Clouds ${b.cloud_cover}%\n\n`;

            response += `⚠️ **Danger Score**\n`;
            response += `  ${regionA}: ${dangerA}/15\n`;
            response += `  ${regionB}: ${dangerB}/15\n\n`;

            response += `───────────────\n`;
            // Smart recommendation
            if (dangerA < dangerB) {
              response += `✅ **${regionA}** has a lower heuristic weather score; road safety is unknown.`;
            } else if (dangerB < dangerA) {
              response += `✅ **${regionB}** has a lower heuristic weather score; road safety is unknown.`;
            } else {
              response += `🤝 Pareho lang sila! Pick mo na lang, pre!`;
            }

            return { text: response, followUps };
          }
        }
      }
      return {
        text: buildCurrentResponse(detectedRegion, data) + `\n\n💡 Tip: "compare Manila vs Cebu" para magkumpara!`,
        followUps,
      };
    }
    default:
      return { text: buildCurrentResponse(detectedRegion, data), followUps };
  }
}

function getIconForEmoji(emoji: string, idx: number | string): React.ReactNode | null {
  switch (emoji) {
    case '📍':
      return <MapPinIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🌡️':
    case '🌡':
      return <ThermometerIcon key={idx} size={14} color="#f97316" className="inline-msg-svg" />;
    case '💧':
      return <DropletIcon key={idx} size={14} color="#3b82f6" className="inline-msg-svg" />;
    case '💨':
      return <WindIcon key={idx} size={14} color="#0284c7" className="inline-msg-svg" />;
    case '👁️':
    case '👁':
      return <EyeIcon key={idx} size={14} color="var(--text-secondary)" className="inline-msg-svg" />;
    case '⚠️':
    case '⚠':
    case '🚨':
      return <AlertTriangleIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '⛅':
    case '🌤️':
    case '🌤':
      return <CloudSunIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '☀️':
      return <SunIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '🌧️':
    case '🌧':
    case '🌦️':
    case '🌦':
      return <CloudRainIcon key={idx} size={14} color="#3b82f6" className="inline-msg-svg" />;
    case '⛈️':
    case '⛈':
      return <CloudLightningIcon key={idx} size={14} color="#6366f1" className="inline-msg-svg" />;
    case '💡':
      return <LightbulbIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '✅':
      return <CheckCircleIcon key={idx} size={14} color="#16a34a" className="inline-msg-svg" />;
    case '🛡️':
    case '🛡':
      return <ShieldIcon key={idx} size={14} color="#16a34a" className="inline-msg-svg" />;
    case '🌊':
      return <WavesIcon key={idx} size={14} color="#3b82f6" className="inline-msg-svg" />;
    case '📅':
      return <CalendarIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '⏰':
    case '⏱️':
      return <ClockIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🚗':
    case '🚕':
      return <CarIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🏍️':
    case '🛵':
      return <MotorcycleIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🚌':
      return <BusIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🚶':
    case '🚶‍♂️':
      return <WalkingIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '☂️':
    case '☔':
      return <UmbrellaIcon key={idx} size={14} color="#3b82f6" className="inline-msg-svg" />;
    case '⚔️':
    case '📈':
      return <TrendingUpIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '📉':
      return <TrendingUpIcon key={idx} size={14} color="#ef4444" className="inline-msg-svg" />;
    case '🥵':
      return <ThermometerIcon key={idx} size={14} color="#ef4444" className="inline-msg-svg" />;
    case '🌫️':
    case '🌫':
      return <CloudIcon key={idx} size={14} color="var(--text-muted)" className="inline-msg-svg" />;
    case '⭐':
    case '🌟':
      return <StarIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '🤝':
      return <CheckCircleIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    default:
      return null;
  }
}

const EMOJI_SPLIT_REGEX = /(📍|🌡️|🌡|💧|💨|👁️|👁|⚠️|⚠|🚨|⛅|🌤️|🌤|☀️|🌧️|🌧|🌦️|🌦|⛈️|⛈|💡|✅|🛡️|🛡|🌊|📅|⏰|⏱️|🚗|🚕|🏍️|🛵|🚌|🚶|🚶‍♂️|☂️|☔|⚔️|📈|📉|🥵|🌫️|🌫|⭐|🌟|🤝)/gu;

function renderRichMessageLine(line: string, key: number | string) {
  if (line.match(/^[─]{3,}$/)) {
    return <hr key={key} className="msg-divider" />;
  }

  const parts = line.split(EMOJI_SPLIT_REGEX);

  const renderedParts = parts.map((part, pIdx) => {
    const icon = getIconForEmoji(part, `${key}-${pIdx}`);
    if (icon) {
      return (
        <span key={pIdx} className="msg-icon-token" aria-hidden="true">
          {icon}
        </span>
      );
    }

    // Split for markdown bold **text**
    const boldParts = part.split(/\*\*(.+?)\*\*/g);
    return (
      <span key={pIdx}>
        {boldParts.map((bPart, bIdx) =>
          bIdx % 2 === 1 ? (
            <strong key={bIdx}>{bPart}</strong>
          ) : (
            <span key={bIdx}>{bPart}</span>
          )
        )}
      </span>
    );
  });

  return (
    <span key={key} className={`msg-line ${line.startsWith('  ') ? 'msg-indent' : ''}`}>
      {renderedParts}
    </span>
  );
}

export function WeatherChatbot({ selectedRegion }: { selectedRegion: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: `📍 **${selectedRegion || 'Philippines'}**\n${getGreeting()} Ako si Kuya Weather — your everyday Philippine weather decision assistant.\n\nSubukan magtanong tungkol sa:\n• **Current weather & Heat Index** sa inyong lugar\n• **7-Day Rain & Thunderstorm** forecast\n• **Trip suitability & preparedness** advisory\n• **Side-by-Side Comparison** ng dalawang probinsya/cities`,
      followUps: [
        `Weather ngayon sa ${selectedRegion || 'NCR'}?`,
        `Uulan ba sa ${selectedRegion || 'Cebu'}?`,
        `Heat index at init sa ${selectedRegion || 'Maynila'}?`,
        `Safe ba mag-travel ngayon?`,
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const response = await generateBotResponse(msg, selectedRegion);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: response.text,
          followUps: response.followUps,
          realityAction: response.realityAction,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Ay naku, may error sa pag-connect! Try mo ulit, tol.',
          followUps: [
            `Weather ngayon sa ${selectedRegion}`,
            `Uulan ba mamaya?`,
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, selectedRegion]);

  return (
    <>
      <button
        className="chatbot-fab"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close weather chatbot' : 'Open weather chatbot'}
        title="Kuya Weather Chatbot"
      >
        {open ? (
          <XIcon size={24} color="white" />
        ) : (
          <MessageCircleIcon size={24} color="white" />
        )}
      </button>

      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="Kuya Weather Assistant">
          <div className="chatbot-header">
            <div className="chatbot-header-branding">
              <div className="chatbot-avatar" aria-hidden="true">
                <BotIcon size={18} color="white" />
                <span className="chatbot-status-dot" />
              </div>
              <div>
                <h3 className="chatbot-title">Kuya Weather</h3>
                <span className="chatbot-subtitle">Rule-based forecast guide · Open-Meteo</span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chatbot">
              <XIcon size={18} color="currentColor" />
            </button>
          </div>

          <div className="chatbot-messages" role="log" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg-wrapper ${msg.role}`}>
                <div className={`chatbot-msg ${msg.role}`}>
                  <div className="msg-label" aria-hidden="true">
                    {msg.role === 'bot' ? (
                      <>
                        <BotIcon size={13} color="var(--accent)" />
                        <span>Kuya Weather</span>
                      </>
                    ) : (
                      <>
                        <UserIcon size={13} color="currentColor" />
                        <span>You</span>
                      </>
                    )}
                  </div>
                  <div className="msg-content">
                    {msg.text.split('\n').map((line, j) => (
                      <div key={j} className="msg-line-wrapper">
                        {renderRichMessageLine(line, `${i}-${j}`)}
                      </div>
                    ))}
                  </div>

                  {msg.role === 'bot' && msg.realityAction && (
                    <div className="msg-reality-action">
                      <button
                        type="button"
                        className="reality-action-btn"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('weather-reality-trigger', {
                              detail: {
                                region: msg.realityAction?.region,
                                hourOffset: msg.realityAction?.hourOffset ?? 0,
                              },
                            })
                          );
                          const el = document.getElementById('weather-reality-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <SparklesIcon size={13} color="var(--accent)" />
                        <span>{msg.realityAction.label}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Contextual Follow-Up Questions (Rendered on Bot Answers) */}
                {msg.role === 'bot' && msg.followUps && msg.followUps.length > 0 && i === messages.length - 1 && (
                  <div className="msg-follow-ups" role="group" aria-label="Suggested follow-up questions">
                    <span className="follow-up-caption">
                      <SparklesIcon size={11} color="var(--accent)" />
                      <span>Suggested Follow-up Questions:</span>
                    </span>
                    <div className="follow-up-chips">
                      {msg.followUps.map((q, idx) => (
                        <button
                          key={idx}
                          className="follow-up-chip"
                          onClick={() => handleSend(q)}
                          type="button"
                          disabled={loading}
                          title={`Ask: "${q}"`}
                        >
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chatbot-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span>Nag-a-analyze si Kuya Weather...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanong ka lang, tol... (e.g. Uulan ba sa Baguio?)"
              disabled={loading}
              aria-label="Type your weather question"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              type="button"
              aria-label="Send message"
            >
              <SendIcon size={16} color="white" />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
