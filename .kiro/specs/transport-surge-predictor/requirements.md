# Requirements Document

## Introduction

The Transport Surge Predictor is a weather-driven module for the PH Rain Forecast dashboard that predicts ride-hailing and public transport demand surges. In the Philippines, rain events trigger immediate spikes in Grab/Angkas pricing and drops in jeepney/bus availability. This module combines real-time weather data from Open-Meteo, time-of-day patterns, and Philippine-specific context (payday cycles, holidays, rush hours) to produce a surge likelihood score with timing predictions — enabling users to plan departures before surges hit or wait them out.

## Data Sources (All Free, No API Keys Required)

- **Open-Meteo Forecast API** — Hourly precipitation probability, precipitation mm, wind speed, wind gusts, visibility, weather codes (already integrated via useWeatherData hook)
- **Open-Meteo Air Quality API** — PM2.5, PM10, aerosol optical depth for visibility correlation (free, no key)
- **Philippine Holiday Calendar** — Static dataset of regular holidays, special non-working days, long weekends
- **Time Heuristics** — Rush hour curves, payday patterns (15th/30th), weekend vs weekday demand profiles
- **Weather Code Severity Mapping** — WMO weather codes mapped to transport disruption levels

## Glossary

- **Surge_Predictor**: The UI module that displays transport surge predictions based on weather and temporal factors
- **Surge_Score**: A numeric value from 0 to 100 representing the likelihood and intensity of a transport demand surge
- **Surge_Level**: A classification of the Surge_Score into one of four levels: LOW (normal demand), MODERATE (slightly elevated), HIGH (significant surge), EXTREME (severe disruption)
- **Surge_Window**: A contiguous time range where elevated transport demand is predicted
- **Weather_Factor**: The component of the Surge_Score derived from precipitation, wind, and visibility data
- **Temporal_Factor**: The component of the Surge_Score derived from time-of-day, day-of-week, and special date patterns
- **Disruption_Index**: A measure of how severely current weather disrupts normal transport operations (flooding risk, road visibility, vehicle availability)
- **Pre_Surge_Alert**: A predictive notification shown before a surge is expected to begin, giving users a departure window
- **Demand_Curve**: A normalized hourly profile of typical transport demand for a given day type (weekday, weekend, holiday, payday)

## Requirements

### Requirement 1: Surge Score Computation Engine

**User Story:** As a commuter, I want the system to compute an accurate surge prediction based on weather and timing, so that I know when transport prices will spike.

#### Acceptance Criteria

1. THE Surge_Predictor SHALL compute a Surge_Score from 0 to 100 using two weighted components: Weather_Factor at 60% weight and Temporal_Factor at 40% weight
2. THE Weather_Factor SHALL be computed from the following sub-signals for each hour: precipitation_probability scored on a 0–100 scale where 0% probability = sub-score 0 and 100% probability = sub-score 100 at 35% sub-weight; precipitation amount in mm scored on a 0–30mm scale where 0mm = sub-score 0 and 30mm or more = sub-score 100 at 30% sub-weight; wind_speed scored on a 0–60 km/h scale where 0 km/h = sub-score 0 and 60 km/h or more = sub-score 100 at 20% sub-weight; visibility scored inversely on a 0–10000m scale where 10000m or more = sub-score 0 and 0m = sub-score 100 at 15% sub-weight
3. THE Temporal_Factor SHALL be computed from: rush_hour_intensity (a predefined curve where 6-9 AM = 70-100, 11 AM-1 PM = 40-60, 5-8 PM = 80-100, other hours = 10-30) at 50% sub-weight; payday_boost (add 20 points if date is 15th or 30th/last day of month, add 10 if within 1 day of payday) at 25% sub-weight; day_type_modifier (weekday = 1.0 multiplier, Saturday = 0.7, Sunday = 0.5, holiday = 0.4, holiday-eve = 0.8) at 25% sub-weight
4. WHEN a WMO weather_code indicates thunderstorm (codes 95-99), THE Surge_Predictor SHALL apply a 1.5x multiplier to the Weather_Factor for that hour, capped at sub-score 100
5. WHEN consecutive hours (3 or more) show precipitation_probability above 60%, THE Surge_Predictor SHALL apply a "sustained rain" bonus of +15 to the Surge_Score for those hours, representing the compounding effect of prolonged rain on transport availability
6. THE Surge_Predictor SHALL clamp the final Surge_Score to the range 0–100 and round to the nearest integer
7. WHEN the Surge_Score is 0–25, THE Surge_Level SHALL be LOW; 26–50 SHALL be MODERATE; 51–75 SHALL be HIGH; 76–100 SHALL be EXTREME

### Requirement 2: Hourly Surge Timeline

**User Story:** As a commuter, I want to see a timeline of predicted surge levels throughout the day, so that I can pick the cheapest time to book a ride.

#### Acceptance Criteria

1. THE Surge_Predictor SHALL display a horizontal scrollable timeline showing Surge_Scores for all 24 hours of the selected forecast day, with each hour rendered as a bar whose height represents the Surge_Score (0–100) and whose color represents the Surge_Level (green for LOW, amber for MODERATE, orange for HIGH, red for EXTREME)
2. THE Surge_Predictor SHALL highlight the current hour with a distinct border or indicator when viewing today's forecast
3. THE Surge_Predictor SHALL identify and label the "cheapest window" — the longest contiguous stretch of 2+ hours where all Surge_Scores are below 30 — by displaying a green bracket or highlight below those bars with the text "Best time to book"
4. THE Surge_Predictor SHALL identify and label the "peak surge window" — the contiguous stretch of 2+ hours with the highest average Surge_Score — by displaying a red bracket above those bars with the text "Avoid booking"
5. WHEN a user taps or hovers over an hour bar, THE Surge_Predictor SHALL display a tooltip showing: the hour (12-hour format), Surge_Score, Surge_Level, top contributing factor (weather vs. rush hour vs. payday), and the estimated surge multiplier (e.g., "~1.8x normal pricing")
6. THE timeline SHALL support keyboard navigation with left/right arrow keys moving focus between hours

### Requirement 3: Pre-Surge Departure Alert

**User Story:** As a commuter, I want to be alerted before a surge starts, so that I can leave early and avoid inflated prices.

#### Acceptance Criteria

1. WHEN the Surge_Score transitions from below 50 to above 50 within the next 3 hours of the current time, THE Surge_Predictor SHALL display a Pre_Surge_Alert banner with the message format: "Surge predicted at [TIME]. Leave by [TIME - 30min] to avoid peak pricing."
2. THE Pre_Surge_Alert SHALL display with a pulsing amber border animation to attract attention without being disruptive
3. THE Pre_Surge_Alert SHALL include a countdown timer showing minutes until the predicted surge begins
4. WHEN the predicted surge start time passes, THE Pre_Surge_Alert SHALL transition to a "Surge active" state with a red background and show the estimated duration based on when Surge_Score is predicted to drop below 50
5. WHEN no surge transition is predicted within the next 3 hours, THE Surge_Predictor SHALL display a calm-state message: "No surge expected soon. Good time to book." with a green background
6. THE Pre_Surge_Alert SHALL update every 5 minutes by re-evaluating the Surge_Score against current time

### Requirement 4: Transport Mode Breakdown

**User Story:** As a commuter, I want to know which transport types are most affected, so that I can choose the best option.

#### Acceptance Criteria

1. THE Surge_Predictor SHALL display a breakdown panel showing predicted impact for 4 transport modes: Grab/Car (ride-hailing cars), Angkas/Motorcycle (two-wheeler ride-hailing), Jeepney/Bus (public mass transit), and Walking/Bike (active transport)
2. FOR Grab/Car, THE impact SHALL be computed as: Surge_Score directly maps to pricing multiplier where Score 0-25 = "Normal (1x)", 26-50 = "Elevated (1.3-1.5x)", 51-75 = "High (1.5-2.5x)", 76-100 = "Extreme (2.5-4x+)"
3. FOR Angkas/Motorcycle, THE impact SHALL apply a wind_speed penalty: if max wind_speed for the hour exceeds 40 km/h, availability drops to "Very Limited" regardless of other scores; if precipitation exceeds 5mm/h, availability is "Limited" due to safety concerns; otherwise mirrors Grab/Car pricing with a 0.8x modifier (slightly cheaper)
4. FOR Jeepney/Bus, THE impact SHALL be: if precipitation_probability exceeds 70% for 3+ consecutive hours, status = "Delayed/Rerouted (flood risk)"; if precipitation_probability is 40-70%, status = "Expect longer waits"; otherwise status = "Normal schedule"
5. FOR Walking/Bike, THE impact SHALL be: if precipitation exceeds 2mm/h OR wind_speed exceeds 30 km/h, status = "Not recommended"; if precipitation_probability exceeds 50%, status = "Risky — bring rain gear"; otherwise status = "Good conditions"
6. EACH transport mode card SHALL display: mode icon, mode name, current status text, a severity color bar (green/amber/red), and a one-line tip (e.g., "Book Grab now before 5 PM surge")

### Requirement 5: Smart Booking Recommendations

**User Story:** As a commuter, I want specific actionable advice on when to book and what to do, so that I save money and time.

#### Acceptance Criteria

1. THE Surge_Predictor SHALL generate up to 3 booking recommendations based on the current time and upcoming Surge_Score pattern, displayed as prioritized action cards
2. WHEN a LOW-to-HIGH surge transition is predicted within 60 minutes, THE first recommendation SHALL be: "Book now — surge starts in [X] minutes. Save ~[Y]% by booking immediately."
3. WHEN the current Surge_Level is HIGH or EXTREME, THE first recommendation SHALL be: "Wait [X] minutes — surge drops to [LEVEL] by [TIME]. Estimated savings: ~[Y]%."
4. WHEN weather data shows a brief dry window (2+ consecutive hours with precipitation_probability below 20%) within an otherwise rainy day, THE Surge_Predictor SHALL recommend: "Dry window [START]-[END]: lower surge, motorcycle available"
5. THE savings percentage estimate SHALL be computed as: ((current_surge_multiplier - predicted_low_multiplier) / current_surge_multiplier) * 100, rounded to the nearest 5%
6. EACH recommendation card SHALL include: a priority number (1-3), an action verb title (Book Now / Wait / Switch Mode), a description with timing, estimated savings, and a confidence indicator (based on how far in the future the prediction is: within 1 hour = "High confidence", 1-3 hours = "Moderate", 3+ hours = "Low")

### Requirement 6: Surge Factors Explanation

**User Story:** As a user, I want to understand why a surge is predicted, so that I can trust the prediction and make informed decisions.

#### Acceptance Criteria

1. THE Surge_Predictor SHALL display a collapsible "Why this prediction?" section showing the breakdown of contributing factors for the current hour
2. THE breakdown SHALL show each factor as a horizontal bar: Weather Impact ([X]% of score), Rush Hour ([X]% of score), Payday Effect ([X]% of score), and Sustained Rain Bonus (if applicable)
3. EACH factor bar SHALL include a one-line explanation: Weather = "Heavy rain reduces vehicle supply"; Rush Hour = "Peak commuter demand 5-8 PM"; Payday = "15th/30th: more people booking rides"; Sustained Rain = "3+ hours of rain compounds demand"
4. THE Surge_Predictor SHALL display the raw data inputs below the factor bars: precipitation probability, precipitation mm, wind speed, visibility, weather code description, and current time context
5. WHEN the user expands the explanation section, THE Surge_Predictor SHALL show a mini line chart comparing today's surge pattern vs. a typical day pattern for this region and day type

### Requirement 7: Air Quality Integration (Visibility Enhancement)

**User Story:** As a commuter, I want air quality factored into predictions because smog and poor visibility also cause transport delays and surge pricing.

#### Acceptance Criteria

1. THE Surge_Predictor SHALL fetch air quality data from the Open-Meteo Air Quality API (endpoint: `https://air-quality-api.open-meteo.com/v1/air-quality`) using the same coordinates as the weather forecast, requesting hourly PM2.5, PM10, and us_aqi parameters for the current day
2. WHEN the US AQI exceeds 150 (Unhealthy), THE Surge_Predictor SHALL add a +10 bonus to the Weather_Factor for those hours, representing reduced visibility and driver reluctance
3. WHEN the US AQI exceeds 200 (Very Unhealthy), THE Surge_Predictor SHALL add a +20 bonus to the Weather_Factor and display an air quality warning badge on the affected hours in the timeline
4. THE Surge_Predictor SHALL cache air quality API responses for 60 minutes using the same caching mechanism as weather data (localStorage with TTL)
5. IF the air quality API call fails, THE Surge_Predictor SHALL continue functioning using only weather and temporal factors without showing an error, and SHALL log the failure to console
6. THE air quality data SHALL be displayed in the Surge Factors Explanation section as an additional factor bar when AQI exceeds 100

### Requirement 8: Multi-Day Surge Overview

**User Story:** As someone planning ahead, I want to see which days this week have the lowest predicted surge, so that I can schedule flexible trips on cheaper days.

#### Acceptance Criteria

1. THE Surge_Predictor SHALL display a 7-day overview strip above the hourly timeline, showing each day's peak Surge_Score and overall Surge_Level as a colored badge
2. EACH day in the overview SHALL display: abbreviated day name, date, peak Surge_Level color dot, and peak-hour label (e.g., "Peak: 6 PM")
3. THE Surge_Predictor SHALL highlight the "best day to travel" — the day with the lowest peak Surge_Score — with a distinct green border and a small trophy/star icon
4. WHEN a user selects a day from the overview strip, THE hourly timeline SHALL update to show that day's predictions
5. THE Surge_Predictor SHALL compute multi-day predictions using the existing 7-day hourly forecast data from useWeatherData (168 hours) without additional API calls
6. FOR future days beyond today, THE Temporal_Factor SHALL use the day_type_modifier for weekday/weekend/holiday but SHALL NOT apply the rush_hour_intensity curve (since exact travel time is unknown), instead using the day's average rush_hour_intensity of 55

### Requirement 9: Module Integration and Display

**User Story:** As a dashboard user, I want the Transport Surge Predictor to fit seamlessly within the existing dashboard design.

#### Acceptance Criteria

1. THE Surge_Predictor SHALL render as a section-card element with a section-header containing a TrendingUpIcon (size 18), an h2 section-title reading "Transport Surge Predictor", a section-badge reading "Live", and a paragraph section-desc reading "Predict ride-hailing price surges based on weather and demand patterns"
2. THE Surge_Predictor SHALL accept the following props from the Dashboard: `region` (string), `hourly` (HourlyData[]), `daily` (DailySummary[]), and `cityCoords` ({ lat: number; lon: number } | null)
3. THE Surge_Predictor SHALL create a co-located CSS file `TransportSurgePredictor.css` imported at the top of the component, using CSS custom properties from the existing theme (--accent, --bg-card, --text-primary, etc.)
4. THE Surge_Predictor SHALL support dark mode without additional logic by using existing CSS custom properties that are swapped by the DarkModeToggle
5. THE Surge_Predictor SHALL be responsive: on viewports below 768px, the transport mode breakdown SHALL stack vertically and the timeline SHALL remain horizontally scrollable with touch/swipe support
6. THE Surge_Predictor SHALL lazy-load using React.lazy() and Suspense with a fallback loading skeleton, following the same pattern as CompareRegions and HistoricalComparison in the Dashboard

