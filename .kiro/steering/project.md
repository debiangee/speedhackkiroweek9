# Weather Lang project steering

React 18/TypeScript/Vite SPA. Forecasts come from validated browser Open-Meteo adapters; daily summaries are local. See docs/ARCHITECTURE.md for contracts and provenance.

DuckDB-WASM/Parquet are not used by the active app. The dormant synthetic pipeline is not a live weather source.

Preserve canonical location/time contracts. Never synthesize official advisories, operational evacuation status, live fares or road-safety guarantees. Run strict typecheck, production-logic tests and build. Preserve the nested repository. No push/deploy without owner authorization.
