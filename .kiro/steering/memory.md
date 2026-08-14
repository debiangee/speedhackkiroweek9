# PH Rain Forecast — Session Memory

## System Context
- **Project**: Weather Lang — Philippines weather companion dashboard
- **Stack**: Vite + React 18 + TypeScript, Recharts, DuckDB-WASM (client), DuckDB Node.js (pipeline)
- **Data**: Parquet files in `public/data/`, queried client-side via DuckDB-WASM

## Key Architecture Decisions
- Functional React components with hooks
- SQL queries run client-side via `useDuckDB` hook's `query()` function
- All chart components are self-contained and fetch their own data
- Data pipeline (`pipeline/generate-data.ts`) produces deterministic output using seeded randomness
- One responsibility per component file

## File Layout
| Path | Purpose |
|------|---------|
| `pipeline/` | Node.js data generation scripts |
| `public/data/` | Generated Parquet files served to browser |
| `src/components/` | React UI components |
| `src/hooks/` | Custom hooks (DuckDB, dark mode, favorites, geolocation, weather cache) |
| `src/utils/` | Types, helpers, city/region lists |

## Commands
| Command | Action |
|---------|--------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run pipeline` | Regenerate Parquet data |

## Conventions
- Use Recharts for all visualizations
- Keep components focused — one responsibility per file
- CSS files co-located with their component (same name, `.css` extension)
- Hooks prefixed with `use` in `src/hooks/`

## Session Log
| Date | What was done |
|------|---------------|
| 2026-08-14 | Created this memory file for session consistency |
| 2026-08-14 | Implemented 8 core features: PWA/offline, Weather Alerts, 7-Day Summary, Share Forecast, Activity Planner, Localization (EN/FIL), Historical Comparison, Rain Heatmap |
| 2026-08-14 | Improved data accuracy: added wind_gusts, cloud_cover, dew_point, visibility, uv_index to HourlyData; enriched DailySummary with humidity, wind, rain/dry hours, dominant weather code; reduced cache TTL to 30min; enhanced optimization engine wind scoring with gust data |
| 2026-08-14 | Rebranded from "Ulan Ba?" to "Weather Lang" — removed third-party credits CTA, updated all branding across i18n, manifest, HTML, share texts, CSS comments, and e2e tests |
