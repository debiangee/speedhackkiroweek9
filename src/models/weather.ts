export interface HourlyData {
  time: string;
  date: string;
  hour: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  wind_gusts: number;
  weather_code: number;
  cloud_cover: number;
  dew_point: number;
  visibility: number;
  uv_index: number;
}

export interface DailySummary {
  date: string;
  avg_prob: number;
  max_prob: number;
  total_rain: number;
  avg_temp: number;
  min_temp: number;
  max_temp: number;
  avg_humidity: number;
  avg_wind: number;
  max_wind_gusts: number;
  dominant_weather_code: number;
  rain_hours: number;
  dry_hours: number;
}

export interface WeatherState {
  loading: boolean;
  error: string | null;
  hourly: HourlyData[];
  daily: DailySummary[];
  lastUpdated: string | null;
}


export interface ForecastMetadata {
  provider: 'Open-Meteo'; sourceUrl: 'https://open-meteo.com/';
  point: { lat: number; lon: number }; timezone: 'Asia/Manila';
  modelReferenceTime: null; retrievedAt: number; validFrom: string; validTo: string;
  quality: 'validated'; delivery: 'network' | 'cache'; cacheAgeMs: number;
  units: { temperature: '°C'; wind: 'km/h'; precipitation: 'mm'; visibility: 'm'; probability: '%' };
}
export interface ForecastRecord { hourly: HourlyData[]; daily: DailySummary[]; metadata: ForecastMetadata }
