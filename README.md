# Team Weather Lang — Your PH Weather Companion

A Philippine weather and daily-planning companion built incrementally on React 18 and TypeScript. Forecasts help users understand weather context; they do not verify road safety, flooding, evacuation operations or transport prices.

The public deployment is https://kiroverse-hack-sprint-shipaton-edition.vercel.app/. Local modernization commits are not automatically deployed.

## What works

- Forecast-first overview: representative location, current-hour **model forecast**, rain probability, hourly precipitation, wind/gusts, humidity, validity and retrieval time.
- Seven-day and hourly exploration, keyboard day selection, optional weekly chart and previous-year comparison.
- City/region catalog search with keyboard interaction, explicit geolocation consent and bounded coverage.
- Trip destination/day/departure windows, explained heuristic suitability and critical-hazard overrides.
- Activity ranking from remaining forecast hours and optional rule-based optimization.
- On-demand RainViewer radar, forecast heatmap, region explorer and Weather Reality imagery/simulation.
- Deterministic Kuya Weather guide with catalog-city context, forecasts, comparisons, unknown-question handling and explicit provider errors. No generative AI service.
- Saved cities/regions, migration of legacy region favorites, share URLs, theme/language preferences and lightweight mode.
- PAGASA official-source directory, static emergency numbers and explicitly unverified OSM facility candidates.

English/Filipino support covers primary navigation, overview and selected controls. Detailed tools retain English/Taglish, disclosed in the UI. Automated accessibility checks cover tested states; complete WCAG certification is not claimed.

## Data integrity and limits

Open-Meteo hourly forecasts are validated before entering recommendation engines. Missing critical variables, invalid units/times or failed requests produce unavailable states, never invented favorable weather. Daily percentages are arithmetic means of hourly probabilities, not the probability of any rain during a whole day.

Forecasts are cached for at most 30 minutes, with visible retrieval/age information. Expired forecasts are not used. Model issue time is not fabricated. Coordinates are representative points, not street-level forecast precision. Geolocation matches GPS to a catalog city on-device.

There is **no official advisory ingestion**. TCWS/rainfall warnings, issue times and expiry windows are not synthesized. Consult PAGASA and local authorities directly. Facility operational status, capacity, opening and accessibility are unverified. Transport scores are heuristics, not actual fares/traffic/driver availability. Street imagery may be historical; overlays are simulations using a forecast for the displayed point.

The migration service worker removes owned legacy caches and does not intercept requests. Offline navigation and background notifications are not supported. Already loaded tabs can use a still-valid cached forecast and show offline messaging. No authentication, database, payments or push-delivery infrastructure is introduced.

## Local development

Canonical repository: `/Users/Macbook/Desktop/Kirovers-Hack-Sprint-Shipaton-Edition`.
The nested `kiro-verse-hack-sprint-shipaton-edition/` is a separate repository and must not be used as this application's root.

Requirements: Node `^24.15.0` or `>=26`, npm 11+. `.nvmrc` records the tested Node 24.18.0 runtime.

```sh
nvm use
npm ci
npm run dev
```

No environment variable is required for the core forecast. Optional `VITE_GOOGLE_MAPS_API_KEY` enables the official Street View embed URL. This is a client-visible browser key and must be origin/API restricted by the owner. Never put privileged credentials in `VITE_*` variables. No key value belongs in source control.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
# Complete local gate:
npm run check
npm audit
npm audit --omit=dev
```

Playwright uses deterministic provider fixtures, Desktop Chrome and Pixel 5 emulation. It starts a local production preview on port 4173; build first. Browser tests cover normal/unavailable data, keyboard search/day selection, representative viewports, core light/dark axe checks, saved/shareable context, blocked storage, trip windows, assistant, Reality keyboard controls, offline expiry and service-worker migration. Tests do not certify live imagery or emergency operations.

For local performance measurement, start a production preview on port 4174, then run the script in another terminal:

```sh
npm run preview -- --host 127.0.0.1 --port 4174
npm run perf:local
```

`WEATHER_PERF_URL` can select another local preview URL. Output goes to ignored `performance-results/mobile-performance.json`; see [performance method and results](docs/PERFORMANCE.md). It is not Lighthouse or production telemetry.

## Architecture and documentation

- [Architecture and cache policy](docs/ARCHITECTURE.md)
- [Design and accessibility foundations](docs/DESIGN_SYSTEM.md)
- [Feature inventory](docs/FEATURES.md)
- [Provider capabilities and deferred integrations](docs/INTEGRATIONS.md)
- [Security and privacy](docs/SECURITY_PRIVACY.md)
- [Executed local validation](docs/VALIDATION.md)
- [Release validation and rollback](docs/RELEASE_CHECKLIST.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

Vite builds static `dist/` assets. Vercel's build runs type checking and bundling; catch-all rewriting serves the SPA. No server/API route is shipped. CSP is report-only pending owner validation of real third-party integrations.

`pipeline/generate-data.ts` is dormant synthetic July 2026 data-generation material, not a live backend. Its undeclared DuckDB dependency was not added and its broken npm command was retired. Do not use generated synthetic data as a weather source.

## License and existing credits

The original project README identifies the license as MIT and credits **Gee Espiritu** ([@debiangee](https://github.com/debiangee)). This modernization does not change those existing credits.
