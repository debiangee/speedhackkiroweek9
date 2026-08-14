import { describe, it, expect } from 'vitest';

// Re-implement the data processing loop from useWeatherData for unit testing
interface HourlyData {
  time: string;
  date: string;
  hour: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  weather_code: number;
}

interface DailySummary {
  date: string;
  avg_prob: number;
  max_prob: number;
  total_rain: number;
  avg_temp: number;
  min_temp: number;
  max_temp: number;
}

function processWeatherData(apiData: {
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    weather_code: number[];
  };
}): { hourly: HourlyData[]; daily: DailySummary[] } {
  const hourly: HourlyData[] = [];
  const dailyMap: Map<string, {
    probs: number[];
    rains: number[];
    temps: number[];
  }> = new Map();

  for (let i = 0; i < apiData.hourly.time.length; i++) {
    const time = apiData.hourly.time[i];
    const date = time.split('T')[0];
    const hour = parseInt(time.split('T')[1].split(':')[0], 10);

    const entry: HourlyData = {
      time,
      date,
      hour,
      temperature: apiData.hourly.temperature_2m[i],
      humidity: apiData.hourly.relative_humidity_2m[i],
      precipitation: apiData.hourly.precipitation[i],
      precipitation_probability: apiData.hourly.precipitation_probability[i],
      wind_speed: apiData.hourly.wind_speed_10m[i],
      weather_code: apiData.hourly.weather_code[i],
    };

    hourly.push(entry);

    if (!dailyMap.has(date)) {
      dailyMap.set(date, { probs: [], rains: [], temps: [] });
    }
    const day = dailyMap.get(date)!;
    day.probs.push(entry.precipitation_probability);
    day.rains.push(entry.precipitation);
    day.temps.push(entry.temperature);
  }

  const daily: DailySummary[] = [];
  for (const [date, stats] of dailyMap.entries()) {
    daily.push({
      date,
      avg_prob: Math.round(stats.probs.reduce((a, b) => a + b, 0) / stats.probs.length),
      max_prob: Math.max(...stats.probs),
      total_rain: Math.round(stats.rains.reduce((a, b) => a + b, 0) * 10) / 10,
      avg_temp: Math.round((stats.temps.reduce((a, b) => a + b, 0) / stats.temps.length) * 10) / 10,
      min_temp: Math.round(Math.min(...stats.temps) * 10) / 10,
      max_temp: Math.round(Math.max(...stats.temps) * 10) / 10,
    });
  }

  return { hourly, daily };
}

function makeApiData(days: number, hoursPerDay = 24) {
  const times: string[] = [];
  const temps: number[] = [];
  const humidity: number[] = [];
  const precip: number[] = [];
  const probs: number[] = [];
  const wind: number[] = [];
  const codes: number[] = [];

  for (let d = 0; d < days; d++) {
    const date = `2026-08-${String(14 + d).padStart(2, '0')}`;
    for (let h = 0; h < hoursPerDay; h++) {
      times.push(`${date}T${String(h).padStart(2, '0')}:00`);
      temps.push(25 + d + (h % 5)); // Varies by day and hour
      humidity.push(70 + (h % 10));
      precip.push(d === 0 ? 0 : d * 0.5); // More rain on later days
      probs.push(d * 15 + (h % 3) * 5); // Increasing prob per day
      wind.push(10 + h);
      codes.push(h < 12 ? 0 : 61); // Clear morning, rain afternoon
    }
  }

  return {
    hourly: {
      time: times,
      temperature_2m: temps,
      relative_humidity_2m: humidity,
      precipitation: precip,
      precipitation_probability: probs,
      wind_speed_10m: wind,
      weather_code: codes,
    },
  };
}

describe('processWeatherData (main data processing loop)', () => {
  it('correctly parses hourly data from API response', () => {
    const apiData = makeApiData(1);
    const { hourly } = processWeatherData(apiData);

    expect(hourly.length).toBe(24);
    expect(hourly[0].date).toBe('2026-08-14');
    expect(hourly[0].hour).toBe(0);
    expect(hourly[23].hour).toBe(23);
  });

  it('correctly extracts date and hour from ISO time string', () => {
    const apiData = {
      hourly: {
        time: ['2026-08-14T09:00', '2026-08-14T15:00'],
        temperature_2m: [28, 32],
        relative_humidity_2m: [80, 70],
        precipitation: [0, 5],
        precipitation_probability: [20, 80],
        wind_speed_10m: [10, 20],
        weather_code: [0, 61],
      },
    };
    const { hourly } = processWeatherData(apiData);

    expect(hourly[0].hour).toBe(9);
    expect(hourly[1].hour).toBe(15);
    expect(hourly[0].date).toBe('2026-08-14');
  });

  it('groups hourly data into daily summaries', () => {
    const apiData = makeApiData(3);
    const { daily } = processWeatherData(apiData);

    expect(daily.length).toBe(3);
    expect(daily[0].date).toBe('2026-08-14');
    expect(daily[1].date).toBe('2026-08-15');
    expect(daily[2].date).toBe('2026-08-16');
  });

  it('calculates correct daily averages', () => {
    const apiData = {
      hourly: {
        time: ['2026-08-14T00:00', '2026-08-14T01:00', '2026-08-14T02:00'],
        temperature_2m: [24, 26, 28],
        relative_humidity_2m: [80, 80, 80],
        precipitation: [1, 2, 3],
        precipitation_probability: [30, 60, 90],
        wind_speed_10m: [10, 10, 10],
        weather_code: [0, 0, 0],
      },
    };
    const { daily } = processWeatherData(apiData);

    expect(daily[0].avg_prob).toBe(60); // (30+60+90)/3
    expect(daily[0].max_prob).toBe(90);
    expect(daily[0].total_rain).toBe(6); // 1+2+3
    expect(daily[0].avg_temp).toBe(26); // (24+26+28)/3
    expect(daily[0].min_temp).toBe(24);
    expect(daily[0].max_temp).toBe(28);
  });

  it('handles a full 7-day forecast (168 hourly entries)', () => {
    const apiData = makeApiData(7);
    const { hourly, daily } = processWeatherData(apiData);

    expect(hourly.length).toBe(168);
    expect(daily.length).toBe(7);
  });

  it('handles empty data', () => {
    const apiData = {
      hourly: {
        time: [],
        temperature_2m: [],
        relative_humidity_2m: [],
        precipitation: [],
        precipitation_probability: [],
        wind_speed_10m: [],
        weather_code: [],
      },
    };
    const { hourly, daily } = processWeatherData(apiData);

    expect(hourly.length).toBe(0);
    expect(daily.length).toBe(0);
  });

  it('rounds values correctly', () => {
    const apiData = {
      hourly: {
        time: ['2026-08-14T00:00', '2026-08-14T01:00'],
        temperature_2m: [25.33, 26.67],
        relative_humidity_2m: [80, 80],
        precipitation: [1.33, 2.67],
        precipitation_probability: [33, 67],
        wind_speed_10m: [10, 10],
        weather_code: [0, 0],
      },
    };
    const { daily } = processWeatherData(apiData);

    expect(daily[0].avg_prob).toBe(50); // Math.round((33+67)/2)
    expect(daily[0].total_rain).toBe(4); // Math.round(4*10)/10
    expect(daily[0].avg_temp).toBe(26); // Math.round(26*10)/10
  });

  it('maintains correct order when iterating over dailyMap entries', () => {
    const apiData = makeApiData(5);
    const { daily } = processWeatherData(apiData);

    for (let i = 1; i < daily.length; i++) {
      expect(daily[i].date > daily[i - 1].date).toBe(true);
    }
  });
});
