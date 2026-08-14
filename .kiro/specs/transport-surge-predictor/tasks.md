# Implementation Tasks

## Task 1: Create Surge Engine (Pure Logic)
- [ ] Create `src/utils/surge-engine.ts` with all pure computation functions
- [ ] Implement `computeWeatherFactor(hourlyData, aqiBonus)` — sub-scores for precip prob (35%), precip amount (30%), wind (20%), visibility (15%), thunderstorm multiplier for WMO codes 95-99
- [ ] Implement `computeTemporalFactor(hour, date)` — rush hour curve, payday boost, day type multiplier
- [ ] Implement `computeSustainedRainBonus(hourly[], hourIndex)` — +15 for 3+ consecutive hours above 60% precip prob
- [ ] Implement `computeSurgeScore(weatherFactor, temporalFactor, sustainedBonus)` — weighted 60/40 + bonus, clamped 0-100
- [ ] Implement `classifySurgeLevel(score)` — LOW/MODERATE/HIGH/EXTREME thresholds
- [ ] Implement `findBestWindow(scores[])` — longest contiguous stretch below 30
- [ ] Implement `findPeakWindow(scores[])` — contiguous stretch with highest average
- [ ] Implement `computeTransportImpact(hourlyData, surgeScore)` — Grab, Angkas, Jeepney, Walking rules
- [ ] Implement `generateRecommendations(scores[], currentHour, hourly[])` — up to 3 action cards
- [ ] Implement `estimateSavings(currentLevel, futureLevel)` — percentage rounded to nearest 5%
- [ ] Export `SurgeLevel`, `SurgeResult`, `TransportImpact`, `Recommendation` TypeScript interfaces

## Task 2: Create Temporal Factors Module
- [ ] Create `src/utils/temporal-factors.ts`
- [ ] Define `RUSH_HOUR_CURVE` — 24-value array matching documented values
- [ ] Implement `isPayday(date)` — true if 15th or last day of month
- [ ] Implement `getPaydayBoost(date)` — 20 if payday, 10 if within 1 day, 0 otherwise
- [ ] Implement `getDayTypeMultiplier(date)` — weekday 1.0, Saturday 0.7, Sunday 0.5, holiday 0.4, holiday-eve 0.8
- [ ] Define `PH_HOLIDAYS_2026` — static array of Philippine regular and special holidays for 2026
- [ ] Implement `isHoliday(date)` and `isHolidayEve(date)` helper functions

## Task 3: Create Air Quality Hook
- [ ] Create `src/hooks/useAirQuality.ts`
- [ ] Fetch from `https://air-quality-api.open-meteo.com/v1/air-quality` with lat/lon, hourly=pm2_5,pm10,us_aqi
- [ ] Implement 60-minute localStorage cache with key `aq-{lat}-{lon}`
- [ ] Return hourly AQI array and loading/error state
- [ ] Graceful fallback: if fetch fails, return empty array (no error surfaced to UI)
- [ ] Implement `getAqiBonus(aqi)` — +10 if AQI > 150, +20 if AQI > 200, 0 otherwise

## Task 4: Create Surge Timeline Component
- [ ] Create `src/components/SurgeTimeline.tsx` and `SurgeTimeline.css`
- [ ] Render 24 vertical bars with heights proportional to Surge_Score (0-100)
- [ ] Color bars by Surge_Level: green (LOW), amber (MODERATE), orange (HIGH), red (EXTREME)
- [ ] Highlight current hour with distinct border
- [ ] Identify and label "Best time to book" bracket (longest stretch below 30)
- [ ] Identify and label "Avoid booking" bracket (peak surge window)
- [ ] Implement hover/tap tooltip: hour, score, level, top factor, estimated multiplier
- [ ] Add keyboard navigation (left/right arrows)
- [ ] Make horizontally scrollable on mobile with touch support

## Task 5: Create Surge Alert Component
- [ ] Create `src/components/SurgeAlert.tsx` and `SurgeAlert.css`
- [ ] Detect surge transitions: score crossing from below 50 to above 50 within next 3 hours
- [ ] Display pre-surge alert with countdown: "Surge predicted at [TIME]. Leave by [TIME-30min]"
- [ ] Pulsing amber border animation for pre-surge state
- [ ] Red background "Surge active" state with estimated duration
- [ ] Green calm-state: "No surge expected soon. Good time to book."
- [ ] Update logic every 5 minutes (useInterval or timer ref)

## Task 6: Create Transport Mode Cards Component
- [ ] Create `src/components/TransportModeCards.tsx` and `TransportModeCards.css`
- [ ] Display 4 cards: Grab/Car, Angkas/Motorcycle, Jeepney/Bus, Walking/Bike
- [ ] Each card: icon, mode name, status text, severity color bar, one-line tip
- [ ] Apply impact rules from surge-engine.ts `computeTransportImpact`
- [ ] Responsive: stack vertically below 768px
- [ ] Dark mode support via CSS custom properties

## Task 7: Create Surge Recommendations Component
- [ ] Create `src/components/SurgeRecommendations.tsx` and `SurgeRecommendations.css`
- [ ] Display up to 3 prioritized action cards from `generateRecommendations`
- [ ] Each card: priority number, action verb title, description, savings estimate, confidence badge
- [ ] Confidence indicators: "High" (within 1h), "Moderate" (1-3h), "Low" (3h+)
- [ ] Savings percentage display (rounded to nearest 5%)

## Task 8: Create Surge Factors Explanation
- [ ] Add collapsible "Why this prediction?" section within TransportSurgePredictor
- [ ] Show horizontal factor bars: Weather Impact, Rush Hour, Payday Effect, Sustained Rain, AQI (if applicable)
- [ ] Each bar: percentage contribution, one-line explanation text
- [ ] Show raw data inputs: precip prob, precip mm, wind, visibility, weather code, time context
- [ ] Mini comparison line: "Today vs. typical day" (computed from average of RUSH_HOUR_CURVE)

## Task 9: Create Main Transport Surge Predictor Component
- [ ] Create `src/components/TransportSurgePredictor.tsx` and `TransportSurgePredictor.css`
- [ ] Accept props: region, hourly, daily, cityCoords
- [ ] Wire up `useSurgeEngine` (useMemo on surge computations)
- [ ] Wire up `useAirQuality` with cityCoords
- [ ] Compose sub-components: SurgeAlert, SurgeTimeline, TransportModeCards, SurgeRecommendations, Factors
- [ ] 7-day overview strip with day badges and "best day" highlight
- [ ] Day selector updates timeline to selected day
- [ ] Section-card wrapper with TrendingUpIcon, "Transport Surge Predictor" title, "Live" badge
- [ ] Dark mode + responsive layout

## Task 10: Integrate into Dashboard
- [ ] Import TransportSurgePredictor with React.lazy() in Dashboard.tsx
- [ ] Add Suspense wrapper with skeleton fallback
- [ ] Pass region, hourly (todayHourly), daily, cityCoords as props
- [ ] Position after "Conditions & Alerts" section (after SmartRecommendations)
- [ ] Verify no TypeScript errors with `npx tsc --noEmit`
- [ ] Verify responsive layout on mobile viewport

## Task 11: Unit Tests for Surge Engine
- [ ] Test `computeWeatherFactor` — boundary values, thunderstorm multiplier, AQI bonus
- [ ] Test `computeTemporalFactor` — rush hours, payday, holidays, weekends
- [ ] Test `computeSurgeScore` — weighted combination, clamping, rounding
- [ ] Test `classifySurgeLevel` — all threshold boundaries
- [ ] Test `findBestWindow` and `findPeakWindow` — edge cases, ties
- [ ] Test `computeTransportImpact` — all 4 modes, boundary conditions
- [ ] Test `generateRecommendations` — transition detection, dry window detection
- [ ] Test `temporal-factors.ts` — isPayday, getPaydayBoost, getDayTypeMultiplier, holiday detection
