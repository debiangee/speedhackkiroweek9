# Architecture and data integrity

React 18/TypeScript SPA bundled by Vite, hosted as Vercel static files. No first-party backend, account database, official-alert ingestion, fare feed or road-status feed exists.

## Contracts
- `utils/locations.ts`: stable catalog IDs, administrative region, representative coordinates, source and Asia/Manila timezone. Coordinates do not imply street-level forecast precision.
- `models/weather.ts`: hourly/daily contracts and provenance. Model reference/issue time is null because this integration does not supply it. Valid hour and retrieval time differ.
- `services/forecast-parser.ts`: all-or-nothing required-variable validation, finite ranges, equal arrays, contiguous time and timezone. Incomplete input is unavailable; never favorable defaults.
- `services/forecast-provider.ts`: point requests shared across forecast/compare/heatmap, 15-second total timeout, at most two attempts for 429/5xx, per-subscriber cancellation. Heatmap batches four points.
- `hooks/useWeatherData.ts`: current-point-only state, minute expiry checks and visibility refresh. No expired fallback.
- `utils/time.ts` and `hooks/useClock.ts`: Philippine date/hour, offset-aware forecast timestamps and long-lived-tab ticks.

## Cache policy
Forecast: 30 minutes maximum, bounded to 64 entries in memory and persistent storage. Reads identify retrieval time and age. After expiry an outage means unavailable, not a stale recommendation.
AQI: optional separate 60-minute cache. History/OSM/radar use separate adapters. The deterministic assistant uses the same validated provider and coordinate cache; no separate weather schema/cache is retained.

The migration service worker clears owned legacy caches and does not intercept requests. Offline shell caching is disabled until revisioned behavior is validated. Already loaded tabs can use fresh local forecast storage; offline navigation may fail. No background warning delivery is promised.

## Safety
Official sources are PAGASA links. No official bulletin, validity, TCWS or issue time is synthesized. Generic OSM facilities have unverified operational status. Trip thresholds are product heuristics, not proof of road safety. Transport scores are weather/calendar heuristics, not prices or observed traffic.

## Legacy
The dormant pipeline generates synthetic July 2026 Parquet and imports undeclared DuckDB. It is not a live weather source. Three.js is unused by current canvas/iframe visualization. Evaluate cleanup after validation.
