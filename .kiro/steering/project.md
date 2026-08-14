# PH Rain Forecast — Project Steering

## Overview
A Philippines rainy-season prediction dashboard that helps users decide whether to travel to a location based on rain forecasts.

## Tech Stack
- **Frontend**: Vite + React 18 + TypeScript
- **Charts**: Recharts
- **Data Engine (server)**: DuckDB (Node.js) — used in `pipeline/` to generate Parquet files
- **Data Engine (client)**: DuckDB-WASM — runs SQL queries against Parquet in the browser
- **Data Format**: Parquet (stored in `public/data/`)

## Project Structure
```
pipeline/          → Node.js data pipeline scripts (run with `npm run pipeline`)
public/data/       → Generated Parquet files served to the client
src/
  components/      → React components (Dashboard, Charts, Selectors)
  hooks/           → Custom hooks (useDuckDB for WASM context)
  utils/           → TypeScript types and helpers
```

## Conventions
- Use functional React components with hooks
- SQL queries run client-side via the `useDuckDB` hook's `query()` function
- All chart components are self-contained and fetch their own data
- Use Recharts for all visualizations
- Data pipeline generates deterministic data using a seeded random function
- Keep components focused: one responsibility per file

## Commands
- `npm run dev` — Start the Vite dev server
- `npm run build` — Production build
- `npm run pipeline` — Regenerate the Parquet data file
