import type { DailySummary, HourlyData } from '../models/weather';
/** Aggregate only supplied, validated hours; callers disclose partial-day periods. */
export function summarizeHours(hourly: HourlyData[]): DailySummary[] {
  const dates = [...new Set(hourly.map(h => h.date))];
  return dates.map(date => {
    const hours = hourly.filter(h => h.date === date);
    const mean = (key: keyof HourlyData) => hours.reduce((sum,h) => sum + Number(h[key]),0) / hours.length;
    const max = (key: keyof HourlyData) => Math.max(...hours.map(h => Number(h[key])));
    const codes = hours.map(h => h.weather_code);
    const dominant = [...new Set(codes)].sort((a,b) => codes.filter(c => c===b).length - codes.filter(c=>c===a).length)[0];
    const rainHours = hours.filter(h => h.precipitation_probability >= 30).length;
    return { date, avg_prob: Math.round(mean('precipitation_probability')), max_prob: max('precipitation_probability'), total_rain: Math.round(hours.reduce((sum,h)=>sum+h.precipitation,0)*10)/10, avg_temp: Math.round(mean('temperature')*10)/10, min_temp: Math.min(...hours.map(h=>h.temperature)), max_temp: max('temperature'), avg_humidity: Math.round(mean('humidity')), avg_wind: Math.round(mean('wind_speed')*10)/10, max_wind_gusts: max('wind_gusts'), dominant_weather_code: dominant, rain_hours: rainHours, dry_hours: hours.length-rainHours };
  });
}
