import type { HourlyData } from '../models/weather';
export function getHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function formatWindow(start: number, end: number): string {
  return `${getHourLabel(start)} - ${getHourLabel(end > 23 ? 23 : end)}`;
}


export function findBestAndWorstWindows(hourly: HourlyData[]) {
  if (hourly.length < 3) return null;

  let bestStart = hourly[0].hour;
  let bestAvg = Infinity;
  let worstStart = hourly[0].hour;
  let worstAvg = -Infinity;

  for (let i = 0; i <= hourly.length - 3; i++) {
    const windowAvg = (
      hourly[i].precipitation_probability +
      hourly[i + 1].precipitation_probability +
      hourly[i + 2].precipitation_probability
    ) / 3;
    if (windowAvg < bestAvg) {
      bestAvg = windowAvg;
      bestStart = hourly[i].hour;
    }
    if (windowAvg > worstAvg) {
      worstAvg = windowAvg;
      worstStart = hourly[i].hour;
    }
  }

  return { bestStart, bestAvg, worstStart, worstAvg };
}
