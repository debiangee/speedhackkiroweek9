# Requirements Document

## Introduction

The Trip Go Checker is a decision-support module for the PH Rain Forecast dashboard. It allows users to select a destination (region and optionally a city) and receive a clear GO / CAUTION / NO-GO verdict based on the rain forecast for that location. The module evaluates multiple weather signals — precipitation probability, total rainfall, wind conditions, and visibility — to produce an actionable recommendation with practical travel advice.

## Glossary

- **Trip_Go_Checker**: The UI module that evaluates weather conditions at a user-selected destination and produces a trip verdict
- **Verdict_Engine**: The logic component that computes the GO / CAUTION / NO-GO decision from weather data
- **Verdict**: A classification of trip safety into one of three levels: GO (safe to travel), CAUTION (travel with preparation), or NO-GO (avoid travel)
- **Destination**: A location defined by a Philippine region and optionally a specific city within that region
- **Weather_Score**: A numeric value from 0 to 100 computed from weighted weather signals, used to determine the verdict
- **Travel_Window**: A contiguous time range within the forecast day that represents favorable or unfavorable travel conditions
- **Condition_Card**: A UI element displaying a single weather metric (rain, wind, visibility) with its severity level

## Requirements

### Requirement 1: Destination Selection

**User Story:** As a traveler, I want to select my destination region and city, so that I can get a weather-based trip assessment for that specific location.

#### Acceptance Criteria

1. THE Trip_Go_Checker SHALL display a region dropdown populated with all 17 Philippine regions from the REGIONS list, with no region pre-selected on first use
2. WHEN a user selects a region, THE Trip_Go_Checker SHALL display a city dropdown populated with all cities from REGION_CITIES for that region and reset any previously selected city to null
3. WHEN a user selects a region without selecting a city, THE Trip_Go_Checker SHALL evaluate weather using the latitude and longitude of the first city entry in REGION_CITIES for that region as the region-level coordinates
4. WHEN a user selects both a region and a city, THE Trip_Go_Checker SHALL evaluate weather using the city-specific latitude and longitude from REGION_CITIES
5. THE Trip_Go_Checker SHALL persist the last selected region and city in browser sessionStorage so that the selection is retained during page reloads within the same browser tab but cleared when the tab is closed
6. IF no region is selected, THEN THE Trip_Go_Checker SHALL disable the weather evaluation action and display a prompt indicating that a region must be selected

### Requirement 2: Weather Data Retrieval

**User Story:** As a traveler, I want the module to fetch accurate forecast data for my destination, so that the trip verdict reflects real conditions.

#### Acceptance Criteria

1. WHEN a destination region or city is selected, THE Trip_Go_Checker SHALL retrieve 7-day hourly forecast data (168 data points) from Open-Meteo via the useWeatherData hook within 10 seconds
2. WHILE weather data is loading, THE Trip_Go_Checker SHALL display a loading skeleton that occupies the same dimensions as the fully rendered module content, preventing layout shift
3. IF the weather data fetch fails and no stale cached data exists for the selected destination, THEN THE Trip_Go_Checker SHALL display an error message indicating the failure reason and a retry button that re-invokes the fetch
4. IF the weather data fetch fails and stale cached data exists in localStorage for the selected destination, THEN THE Trip_Go_Checker SHALL display the stale data with a visible indicator that the data is from an offline cache
5. THE Trip_Go_Checker SHALL use the existing 30-minute cache from useWeatherData so that repeated requests for the same destination coordinates within 30 minutes return cached data without issuing a new API call
6. IF the selected destination does not map to known coordinates, THEN THE Trip_Go_Checker SHALL display an error message indicating the region is unrecognized and SHALL NOT issue an API request
7. WHEN multiple destination changes occur within 300 milliseconds, THE Trip_Go_Checker SHALL issue only one API request for the final selected destination

### Requirement 3: Trip Verdict Computation

**User Story:** As a traveler, I want a clear go/no-go decision based on weather conditions, so that I can decide whether to proceed with my trip.

#### Acceptance Criteria

1. THE Verdict_Engine SHALL compute a Weather_Score from 0 to 100 using the following weighted signals averaged across all hourly records for the selected forecast day: precipitation_probability averaged across hours then inverted (0% probability = sub-score 100, 100% probability = sub-score 0) at 40% weight; total precipitation in mm summed across hours then scored inversely on a 0–50 mm scale (0 mm = sub-score 100, 50 mm or more = sub-score 0) at 25% weight; wind_speed averaged across hours then scored inversely on a 0–80 km/h scale (0 km/h = sub-score 100, 80 km/h or more = sub-score 0) at 20% weight; visibility averaged across hours then scored linearly on a 0–10,000 m scale (0 m = sub-score 0, 10,000 m or more = sub-score 100) at 15% weight
2. WHEN the Weather_Score is 70 or above, THE Verdict_Engine SHALL classify the verdict as GO
3. WHEN the Weather_Score is between 40 and 69 inclusive, THE Verdict_Engine SHALL classify the verdict as CAUTION
4. WHEN the Weather_Score is below 40, THE Verdict_Engine SHALL classify the verdict as NO-GO
5. THE Verdict_Engine SHALL compute the Weather_Score using only the hourly data for the selected forecast day, requiring a minimum of 1 hourly record to produce a verdict
6. IF the selected forecast day contains zero hourly records, THEN THE Verdict_Engine SHALL not produce a verdict and SHALL display a message indicating that insufficient data is available
7. THE Verdict_Engine SHALL clamp each sub-score to the range 0–100 before applying weights, and SHALL round the final Weather_Score to the nearest integer, ensuring exactly one of the three verdict levels (GO, CAUTION, NO-GO) is produced for any valid input

### Requirement 4: Verdict Display

**User Story:** As a traveler, I want to see the trip verdict clearly and immediately, so that I can make a quick decision.

#### Acceptance Criteria

1. THE Trip_Go_Checker SHALL display the verdict as a full-width banner with a minimum height of 64px, using distinct background colors: green for GO, amber for CAUTION, red for NO-GO, with the verdict label displayed in bold text at minimum 24px font size
2. THE Trip_Go_Checker SHALL display a summary sentence of no more than 120 characters below the verdict banner, stating the primary contributing factor (the weather signal whose individual weighted score is lowest among precipitation_probability, total_precipitation, wind_speed, and visibility)
3. THE Trip_Go_Checker SHALL display exactly 4 Condition_Cards showing: average rain probability (in %), total rainfall (in mm), average wind speed (in km/h), and average visibility (in km), each with a severity indicator (good, moderate, or poor) based on that metric's individual contribution to the Weather_Score
4. WHEN the verdict is CAUTION or NO-GO, THE Trip_Go_Checker SHALL display the primary contributing factor (the weather signal with the lowest individual weighted score) as a visually distinct badge on the verdict banner using contrasting background color and bold text
5. WHEN the verdict computation completes, THE Trip_Go_Checker SHALL render the full verdict display (banner, summary, and Condition_Cards) within 200ms

### Requirement 5: Best Travel Window

**User Story:** As a traveler, I want to know the best and worst time windows for travel, so that I can plan my departure accordingly.

#### Acceptance Criteria

1. THE Trip_Go_Checker SHALL identify the best 3-hour Travel_Window within the forecast day by finding the window with the highest Weather_Score, where a 3-hour Travel_Window is a sliding window starting at each hour from 0 through 21 (22 possible windows), and if multiple windows share the highest score, the earliest window SHALL be selected
2. THE Trip_Go_Checker SHALL identify the worst 3-hour Travel_Window within the forecast day by finding the window with the lowest Weather_Score, and if multiple windows share the lowest score, the earliest window SHALL be selected
3. THE Trip_Go_Checker SHALL display both windows showing each window's start time, end time, and Weather_Score rounded to the nearest integer (range 0–100)
4. IF all 22 possible 3-hour windows have a Weather_Score below 40, THEN THE Trip_Go_Checker SHALL display a message recommending the user postpone travel
5. IF the forecast day contains fewer than 3 hours of hourly data, THEN THE Trip_Go_Checker SHALL not display any Travel_Window results

### Requirement 6: Practical Travel Advice

**User Story:** As a traveler, I want practical advice on what to bring and how to prepare, so that I can travel safely regardless of the verdict.

#### Acceptance Criteria

1. WHEN the verdict is GO, THE Trip_Go_Checker SHALL display the following advice items as a list: sunscreen reminder, hydration reminder, and confirmation that rain gear is optional
2. WHEN the verdict is CAUTION, THE Trip_Go_Checker SHALL display the following advice items as a list: bring umbrella, wear waterproof footwear, have an indoor backup plan, and check forecast updates before leaving
3. WHEN the verdict is NO-GO, THE Trip_Go_Checker SHALL display the following advice items as a list: postpone if possible, use heavy rain gear if travel is unavoidable, avoid flood-prone routes, and monitor weather alerts
4. WHEN the maximum hourly wind_speed for the selected day exceeds 40 km/h, THE Trip_Go_Checker SHALL append a wind advisory item to the advice list indicating the expected wind speed and recommending securing loose belongings, regardless of the verdict level
5. IF weather data for the selected day is unavailable, THEN THE Trip_Go_Checker SHALL display a message indicating that advice cannot be generated and suggesting the user retry when data becomes available

### Requirement 7: Day Selector

**User Story:** As a traveler, I want to check the verdict for different days in the forecast, so that I can pick the best day for my trip.

#### Acceptance Criteria

1. THE Trip_Go_Checker SHALL display a horizontal day selector showing the next 7 forecast days, where each day displays its weekday name (or "Today"/"Tomorrow" for the first two) and calendar date
2. WHEN a user selects a day, THE Trip_Go_Checker SHALL recompute the verdict using the 24 hourly data points for that specific day and display the updated verdict within 1 second of selection
3. THE Trip_Go_Checker SHALL highlight each day with a color indicator matching its verdict level: green for average precipitation probability below 30%, amber for 30% to below 60%, and red for 60% or above
4. WHEN the day selector initially loads, THE Trip_Go_Checker SHALL select the current day as the active day and display its verdict
5. THE Trip_Go_Checker SHALL visually distinguish the currently selected day from unselected days
6. IF hourly forecast data is unavailable for a given day, THEN THE Trip_Go_Checker SHALL display that day without a color indicator and disable selection for it

### Requirement 8: Module Integration

**User Story:** As a dashboard user, I want the Trip Go Checker to fit within the existing dashboard layout, so that the experience is consistent.

#### Acceptance Criteria

1. THE Trip_Go_Checker SHALL render as a section-card element containing a section-header with an icon component (size 18), an h2 section-title, and a paragraph section-desc, matching the class names and nesting order used by other dashboard section-cards
2. THE Trip_Go_Checker SHALL accept HourlyData arrays and DailySummary arrays as props corresponding to the currently selected dashboard region on initial mount
3. WHEN the user selects a different destination within the Trip_Go_Checker module, THE Trip_Go_Checker SHALL fetch and display weather data for the newly selected destination without changing the main dashboard region selector value
4. WHEN the main dashboard region selector value changes while the Trip_Go_Checker has an independently selected destination, THE Trip_Go_Checker SHALL reset to display data for the new dashboard-selected region
5. THE Trip_Go_Checker SHALL include a co-located CSS file imported at the top of the component file, following the project convention of one CSS file per component with matching filename
6. IF the Trip_Go_Checker fails to fetch weather data for an independently selected destination, THEN THE Trip_Go_Checker SHALL display an inline error message indicating the fetch failure and retain the last successfully loaded data
