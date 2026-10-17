# Local performance evidence

Measured with `npm run perf:local` against a local production build on port 4174. Chromium, new contexts, 390×844 viewport, 4× CPU slowdown, 150ms network latency, 200,000 B/s download and 75,000 B/s upload. Weather responses are deterministic fixtures for the current calendar period. No fake browser clock is used for timing measurements.

Three cold-context samples:

| Run | FCP | LCP | CLS | Initial JS transfer |
|---|---:|---:|---:|---:|
| 1 | 1420 ms | 1420 ms | 0 | 84,346 bytes |
| 2 | 1020 ms | 1020 ms | 0 | 84,346 bytes |
| 3 | 1028 ms | 1028 ms | 0 | 84,346 bytes |

Median local FCP/LCP: 1028ms. No Leaflet, Recharts or Weather Reality chunks loaded initially. Raw output is a local ignored artifact: test-results/mobile-performance.json.

These are not Lighthouse scores, real-device results, upstream-provider latency, Vercel telemetry or production Core Web Vitals. No baseline LCP was measured, so no LCP improvement percentage is claimed. Initial timing attempt used a fixture clock, which suppressed navigation timing; that attempt failed and was replaced with unmodified browser timing.

Baseline entry JS was ~148KB and eager Leaflet ~154KB. Current entry is ~126KB and Leaflet is deferred; React vendor remains ~146KB. Current initial CSS ~57KB vs baseline ~76KB. Build output sizes are distinct from compressed network transfer and do not establish production performance.
