/**
 * Data Pipeline: Generates Philippine weather data with HOURLY granularity.
 * Covers all major cities across all Philippine regions with realistic rain predictions.
 * Generates 7 days of hourly forecasts (168 hours per location).
 */
import duckdb from 'duckdb';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'ph_rain_forecast.parquet');

// All major Philippine cities by region with rain characteristics
const LOCATIONS = [
  // NCR
  { name: 'Manila', region: 'NCR', lat: 14.5995, lon: 120.9842, rain_factor: 1.0 },
  { name: 'Quezon City', region: 'NCR', lat: 14.676, lon: 121.0437, rain_factor: 1.0 },
  // CAR
  { name: 'Baguio', region: 'CAR', lat: 16.4023, lon: 120.596, rain_factor: 1.4 },
  // Ilocos Region
  { name: 'Laoag', region: 'Ilocos', lat: 18.1979, lon: 120.5936, rain_factor: 0.7 },
  { name: 'Vigan', region: 'Ilocos', lat: 17.5747, lon: 120.3869, rain_factor: 0.75 },
  { name: 'San Fernando (LU)', region: 'Ilocos', lat: 16.6159, lon: 120.3209, rain_factor: 0.8 },
  // Cagayan Valley
  { name: 'Tuguegarao', region: 'Cagayan Valley', lat: 17.6132, lon: 121.727, rain_factor: 0.95 },
  { name: 'Santiago', region: 'Cagayan Valley', lat: 16.6892, lon: 121.5486, rain_factor: 0.9 },
  // Central Luzon
  { name: 'Angeles', region: 'Central Luzon', lat: 15.145, lon: 120.5887, rain_factor: 0.9 },
  { name: 'Olongapo', region: 'Central Luzon', lat: 14.8292, lon: 120.2824, rain_factor: 0.85 },
  { name: 'Tarlac', region: 'Central Luzon', lat: 15.4364, lon: 120.5964, rain_factor: 0.88 },
  // CALABARZON
  { name: 'Batangas', region: 'CALABARZON', lat: 13.7565, lon: 121.0583, rain_factor: 0.85 },
  { name: 'Lucena', region: 'CALABARZON', lat: 13.9373, lon: 121.617, rain_factor: 0.9 },
  { name: 'Antipolo', region: 'CALABARZON', lat: 14.6258, lon: 121.1245, rain_factor: 0.95 },
  // MIMAROPA
  { name: 'Puerto Princesa', region: 'MIMAROPA', lat: 9.7392, lon: 118.7353, rain_factor: 0.8 },
  { name: 'Calapan', region: 'MIMAROPA', lat: 13.4115, lon: 121.1804, rain_factor: 0.82 },
  // Bicol
  { name: 'Legazpi', region: 'Bicol', lat: 13.1391, lon: 123.7438, rain_factor: 1.3 },
  { name: 'Naga', region: 'Bicol', lat: 13.6218, lon: 123.1948, rain_factor: 1.1 },
  { name: 'Sorsogon', region: 'Bicol', lat: 12.9742, lon: 124.0049, rain_factor: 1.25 },
  // Western Visayas
  { name: 'Iloilo City', region: 'Western Visayas', lat: 10.7202, lon: 122.5621, rain_factor: 0.9 },
  { name: 'Bacolod', region: 'Western Visayas', lat: 10.6764, lon: 122.9509, rain_factor: 0.85 },
  { name: 'Roxas City', region: 'Western Visayas', lat: 11.5851, lon: 122.7511, rain_factor: 0.88 },
  { name: 'Boracay', region: 'Western Visayas', lat: 11.9674, lon: 121.9248, rain_factor: 0.85 },
  // Central Visayas
  { name: 'Cebu City', region: 'Central Visayas', lat: 10.3157, lon: 123.8854, rain_factor: 0.75 },
  { name: 'Lapu-Lapu', region: 'Central Visayas', lat: 10.3103, lon: 123.9494, rain_factor: 0.74 },
  { name: 'Tagbilaran', region: 'Central Visayas', lat: 9.6407, lon: 123.8533, rain_factor: 0.72 },
  { name: 'Dumaguete', region: 'Central Visayas', lat: 9.3068, lon: 123.3054, rain_factor: 0.7 },
  // Eastern Visayas
  { name: 'Tacloban', region: 'Eastern Visayas', lat: 11.25, lon: 125.0, rain_factor: 1.2 },
  { name: 'Ormoc', region: 'Eastern Visayas', lat: 11.0044, lon: 124.6075, rain_factor: 1.1 },
  // Zamboanga Peninsula
  { name: 'Zamboanga', region: 'Zamboanga Peninsula', lat: 6.9214, lon: 122.079, rain_factor: 0.7 },
  { name: 'Dipolog', region: 'Zamboanga Peninsula', lat: 8.5892, lon: 123.3407, rain_factor: 0.75 },
  // Northern Mindanao
  { name: 'Cagayan de Oro', region: 'Northern Mindanao', lat: 8.4542, lon: 124.6319, rain_factor: 0.8 },
  { name: 'Iligan', region: 'Northern Mindanao', lat: 8.2289, lon: 124.2453, rain_factor: 0.82 },
  // Davao
  { name: 'Davao City', region: 'Davao', lat: 7.1907, lon: 125.4553, rain_factor: 0.85 },
  { name: 'Tagum', region: 'Davao', lat: 7.4478, lon: 125.8078, rain_factor: 0.8 },
  { name: 'Digos', region: 'Davao', lat: 6.7497, lon: 125.3572, rain_factor: 0.78 },
  // SOCCSKSARGEN
  { name: 'General Santos', region: 'SOCCSKSARGEN', lat: 6.1164, lon: 125.1716, rain_factor: 0.65 },
  { name: 'Koronadal', region: 'SOCCSKSARGEN', lat: 6.5022, lon: 124.8469, rain_factor: 0.68 },
  { name: 'Kidapawan', region: 'SOCCSKSARGEN', lat: 7.0084, lon: 125.0894, rain_factor: 0.72 },
  // Caraga
  { name: 'Butuan', region: 'Caraga', lat: 8.9475, lon: 125.5406, rain_factor: 0.9 },
  { name: 'Surigao', region: 'Caraga', lat: 9.7571, lon: 125.499, rain_factor: 1.0 },
  { name: 'Siargao', region: 'Caraga', lat: 9.8482, lon: 126.0458, rain_factor: 1.1 },
  // BARMM
  { name: 'Cotabato City', region: 'BARMM', lat: 7.2047, lon: 124.231, rain_factor: 0.75 },
  { name: 'Marawi', region: 'BARMM', lat: 7.9986, lon: 124.2928, rain_factor: 0.78 },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Hourly rain patterns — rain is more likely in afternoon during PH rainy season
const HOURLY_WEIGHT: Record<number, number> = {
  0: 0.3, 1: 0.25, 2: 0.2, 3: 0.15, 4: 0.15, 5: 0.2,
  6: 0.3, 7: 0.35, 8: 0.4, 9: 0.45, 10: 0.5, 11: 0.55,
  12: 0.7, 13: 0.8, 14: 0.9, 15: 1.0, 16: 0.95, 17: 0.85,
  18: 0.75, 19: 0.65, 20: 0.55, 21: 0.45, 22: 0.4, 23: 0.35,
};

function generateData(): string[] {
  const rows: string[] = [];
  const rand = seededRandom(42);
  const startDate = new Date(2026, 6, 25); // July 25, 2026

  for (const loc of LOCATIONS) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);
      const dateStr = currentDate.toISOString().split('T')[0];

      const monthBase = 0.75;
      const dayVariation = (rand() - 0.5) * 0.2;
      const dayBaseProb = Math.min(0.95, Math.max(0.2, monthBase * loc.rain_factor + dayVariation));
      const isRainyDay = rand() < dayBaseProb;

      for (let hour = 0; hour < 24; hour++) {
        const hourWeight = HOURLY_WEIGHT[hour];
        let rainProbability: number;

        if (isRainyDay) {
          rainProbability = Math.min(98, Math.max(15, Math.round(
            (dayBaseProb * 100 * hourWeight) + (rand() - 0.5) * 20
          )));
        } else {
          rainProbability = Math.min(45, Math.max(5, Math.round(
            (dayBaseProb * 40 * hourWeight) + (rand() - 0.5) * 10
          )));
        }

        const willRain = rand() < (rainProbability / 100);
        const rainfallMm = willRain
          ? Math.round((rand() * 15 + 1) * loc.rain_factor * hourWeight * 10) / 10
          : 0;

        const hourTempOffset = hour >= 6 && hour <= 18
          ? (hour - 6) * 0.4 - (hour > 12 ? (hour - 12) * 0.3 : 0)
          : -2;
        const baseTemp = 27 + hourTempOffset + (rand() * 3 - 1.5);
        const temperature = willRain ? baseTemp - 2 - rand() * 1.5 : baseTemp + rand();

        const humidity = willRain
          ? Math.round(78 + rand() * 18)
          : Math.round(58 + rand() * 20);

        const windSpeed = Math.round((5 + rand() * 20) * (willRain ? 1.3 : 1) * 10) / 10;

        let intensity = 'None';
        if (rainfallMm > 0 && rainfallMm <= 2.5) intensity = 'Light';
        else if (rainfallMm > 2.5 && rainfallMm <= 7.5) intensity = 'Moderate';
        else if (rainfallMm > 7.5 && rainfallMm <= 15) intensity = 'Heavy';
        else if (rainfallMm > 15) intensity = 'Torrential';

        const feelsLike = Math.round((temperature + (humidity / 100) * 3 - (windSpeed / 10)) * 10) / 10;

        rows.push(
          `('${dateStr}', ${hour}, '${loc.name}', '${loc.region}', ${loc.lat}, ${loc.lon}, ` +
          `${rainProbability}, ${rainfallMm}, ` +
          `${Math.round(temperature * 10) / 10}, ${Math.round(feelsLike * 10) / 10}, ` +
          `${humidity}, ${windSpeed}, '${intensity}')`
        );
      }
    }
  }

  return rows;
}

async function main() {
  console.log('🚀 Starting PH Rain Forecast data pipeline...');
  console.log(`📍 ${LOCATIONS.length} cities across all Philippine regions`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const db = new duckdb.Database(':memory:');
  const conn = db.connect();

  conn.run(`
    CREATE TABLE ph_weather (
      date DATE,
      hour INTEGER,
      location VARCHAR,
      region VARCHAR,
      latitude DOUBLE,
      longitude DOUBLE,
      rain_probability INTEGER,
      rainfall_mm DOUBLE,
      temperature DOUBLE,
      feels_like DOUBLE,
      humidity INTEGER,
      wind_speed DOUBLE,
      rain_intensity VARCHAR
    )
  `);

  console.log('📊 Generating hourly weather data (7 days × 24 hours)...');
  const rows = generateData();

  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    conn.run(`INSERT INTO ph_weather VALUES ${batch.join(',')}`);
  }

  console.log(`✅ Generated ${rows.length} hourly weather records`);

  conn.run(`COPY ph_weather TO '${OUTPUT_FILE}' (FORMAT PARQUET, COMPRESSION ZSTD)`);
  console.log(`📦 Exported to: ${OUTPUT_FILE}`);

  conn.all(`
    SELECT 
      region,
      COUNT(DISTINCT location) as cities,
      ROUND(AVG(rain_probability), 1) as avg_rain_prob
    FROM ph_weather 
    GROUP BY region
    ORDER BY avg_rain_prob DESC
  `, (err: Error | null, result: Array<Record<string, unknown>>) => {
    if (err) { console.error(err); return; }
    console.log('\n📈 Region Summary:');
    console.table(result);
  });

  conn.close();
  db.close();
}

main().catch(console.error);
