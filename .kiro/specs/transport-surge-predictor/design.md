# Design Document

## Architecture Overview

The Transport Surge Predictor is a client-side prediction engine that combines weather signals from Open-Meteo (already integrated) with temporal heuristics to produce transport demand surge forecasts. No backend required — all computation runs in the browser.

```
┌─────────────────────────────────────────────────────┐
│ Dashboard (parent)                                   │
│  ├─ passes: region, hourly[], daily[], cityCoords   │
│  └─ renders: <TransportSurgePredictor />            │
└─────────────┬───────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────┐
│ TransportSurgePredictor.tsx                          │
│  ├─ useSurgeEngine(hourly, daily, region, coords)   │
│  ├─ useAirQuality(coords)                           │
│  └─ UI: Timeline, Alert, ModeBreakdown, Recs        │
└─────────────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────┐
│ surge-engine.ts (pure logic, testable)               │
│  ├─ computeWeatherFactor(hourlyData)                 │
│  ├─ computeTemporalFactor(hour, date, dayType)       │
│  ├─ computeSurgeScore(weather, temporal, bonuses)     │
│  ├─ classifySurgeLevel(score)                        │
│  ├─ findBestWindow(scores[])                         │
│  ├─ findPeakWindow(scores[])                         │
│  ├─ generateRecommendations(scores[], currentHour)   │
│  └─ computeTransportImpact(hourlyData, surgeScore)   │
└─────────────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────┐
│ temporal-factors.ts (static data + logic)             │
│  ├─ RUSH_HOUR_CURVE: number[] (24 values)            │
│  ├─ isPayday(date): boolean                          │
│  ├─ getPaydayBoost(date): number                     │
│  ├─ getDayTypeMultiplier(date): number               │
│  └─ PH_HOLIDAYS_2026: Date[]                         │
└─────────────────────────────────────────────────────┘
```

## API Integrations

### 1. Open-Meteo Weather (Existing)
Already integrated via `useWeatherData` hook. Provides:
- `precipitation_probability` (0-100%)
- `precipitation` (mm/h)
- `wind_speed` (km/h)
- `wind_gusts` (km/h)
- `visibility` (meters)
- `weather_code` (WMO codes)

No additional API call needed — data arrives as props from Dashboard.

### 2. Open-Meteo Air Quality (New)
```
GET https://air-quality-api.open-meteo.com/v1/air-quality
  ?latitude={lat}
  &longitude={lon}
  &hourly=pm2_5,pm10,us_aqi
  &timezone=Asia/Manila
  &forecast_days=1
```
- Free, no API key
- Rate limit: Same as weather API (~10,000 requests/day)
- Cache: 60 minutes in localStorage

### 3. Philippine Holidays (Static)
Embedded as a TypeScript constant — no API call. Includes:
- Regular holidays (New Year, Independence Day, Christmas, etc.)
- Special non-working days (Ninoy Aquino Day, All Saints, etc.)
- Known long weekends and bridges

## File Structure

```
src/
  components/
    TransportSurgePredictor.tsx    → Main component
    TransportSurgePredictor.css    → Styles
    SurgeTimeline.tsx              → Hourly bar chart timeline
    SurgeTimeline.css
    SurgeAlert.tsx                 → Pre-surge departure alert
    SurgeAlert.css
    TransportModeCards.tsx         → 4 transport mode breakdown
    TransportModeCards.css
    SurgeRecommendations.tsx       → Smart booking recommendations
    SurgeRecommendations.css
  hooks/
    useAirQuality.ts              → Air quality API hook
  utils/
    surge-engine.ts               → Pure computation logic
    temporal-factors.ts           → Rush hours, holidays, payday
```

## Surge Score Algorithm (Detailed)

### Weather Factor (60% of total)

```typescript
function computeWeatherFactor(h: HourlyData, aqiBonus: number): number {
  // Sub-scores (all 0-100, higher = more surge-inducing)
  const precipProbScore = clamp(h.precipitation_probability, 0, 100);
  const precipAmountScore = clamp((h.precipitation / 30) * 100, 0, 100);
  const windScore = clamp((h.wind_speed / 60) * 100, 0, 100);
  const visibilityScore = clamp(((10000 - h.visibility) / 10000) * 100, 0, 100);

  let weatherFactor = (
    precipProbScore * 0.35 +
    precipAmountScore * 0.30 +
    windScore * 0.20 +
    visibilityScore * 0.15
  );

  // Thunderstorm multiplier (WMO codes 95-99)
  if (h.weather_code >= 95 && h.weather_code <= 99) {
    weatherFactor = Math.min(weatherFactor * 1.5, 100);
  }

  // Air quality bonus
  weatherFactor = Math.min(weatherFactor + aqiBonus, 100);

  return weatherFactor;
}
```

### Temporal Factor (40% of total)

```typescript
const RUSH_HOUR_CURVE = [
  10, 10, 10, 10, 15, 30,  // 0-5 AM
  70, 90, 100, 80, 50, 40, // 6-11 AM
  55, 60, 50, 40, 45, 70,  // 12-5 PM
  90, 100, 80, 50, 30, 15  // 6-11 PM
];

function computeTemporalFactor(hour: number, date: Date): number {
  const rushIntensity = RUSH_HOUR_CURVE[hour]; // 0-100
  const paydayBoost = getPaydayBoost(date);    // 0, 10, or 20
  const dayMultiplier = getDayTypeMultiplier(date); // 0.4-1.0

  const temporal = (
    (rushIntensity * 0.50) +
    (paydayBoost * 0.25) +
    (dayMultiplier * 100 * 0.25)
  );

  return clamp(temporal, 0, 100);
}
```

### Sustained Rain Bonus

```typescript
function computeSustainedRainBonus(hourly: HourlyData[], hourIndex: number): number {
  // Check if 3+ consecutive hours have precip prob > 60%
  let consecutiveCount = 0;
  for (let i = Math.max(0, hourIndex - 2); i <= Math.min(hourly.length - 1, hourIndex + 2); i++) {
    if (hourly[i].precipitation_probability > 60) {
      consecutiveCount++;
    } else {
      consecutiveCount = 0;
    }
    if (consecutiveCount >= 3) return 15;
  }
  return 0;
}
```

### Final Score

```typescript
function computeSurgeScore(weatherFactor: number, temporalFactor: number, sustainedBonus: number): number {
  const raw = (weatherFactor * 0.60) + (temporalFactor * 0.40) + sustainedBonus;
  return Math.round(clamp(raw, 0, 100));
}
```

## Transport Mode Impact Rules

| Mode | Pricing/Status Logic |
|------|---------------------|
| Grab/Car | Score 0-25: "1x Normal" / 26-50: "1.3-1.5x" / 51-75: "1.5-2.5x" / 76-100: "2.5-4x+" |
| Angkas/Motorcycle | Wind > 40 km/h → "Very Limited"; Precip > 5mm → "Limited"; else Grab pricing × 0.8 |
| Jeepney/Bus | 3h consecutive precip_prob > 70% → "Delayed/Rerouted"; 40-70% → "Longer waits"; else "Normal" |
| Walking/Bike | Precip > 2mm OR wind > 30 → "Not recommended"; prob > 50% → "Risky"; else "Good" |

## Recommendation Generation Logic

```
1. Look at scores for current_hour through current_hour + 6
2. If transition LOW→HIGH within 60 min: "Book now, save X%"
3. If currently HIGH/EXTREME: Find next hour below 50, recommend "Wait X min"
4. If dry window exists (2+ hours prob < 20%): "Dry window: motorcycle available"
5. Cap at 3 recommendations, prioritize by savings potential
```

## Savings Estimate Calculation

```typescript
const SURGE_MULTIPLIERS = [1.0, 1.4, 2.0, 3.2]; // LOW, MODERATE, HIGH, EXTREME
// Savings = ((current_multiplier - future_low_multiplier) / current_multiplier) * 100
// Rounded to nearest 5%
```

## Caching Strategy

- Weather data: Already cached 30 min by useWeatherData
- Air quality: Cache 60 min in localStorage with key `aq-{lat}-{lon}`
- Surge computations: Memoized per hourly data change (useMemo)
- No server-side caching needed

## Performance Considerations

- Surge engine is pure math — all 24 hours computed in <5ms
- Air quality fetch is non-blocking; UI renders with weather-only scores first, updates when AQ arrives
- Timeline uses CSS transforms for bar heights (GPU-accelerated)
- Lazy-loaded via React.lazy() — doesn't block initial Dashboard render

## Accessibility

- Timeline bars have aria-label with full score description
- Keyboard navigable with arrow keys
- Surge levels have both color AND text labels
- Alert banner uses role="alert" for screen reader announcement
- High contrast mode respects prefers-contrast media query
