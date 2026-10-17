# Local release-candidate validation — October 18, 2026

Scope: populated canonical repository, feature/weather-lang-modernization-phase0-6, starting commit 7b9ddcc165aa3dfd195c39f6d33c7a43eeb6c219. Node24.18.0/npm11.16.0 on macOS. This record is committed with the candidate; use git rev-parse HEAD for its final identity.

| Gate | Actual result |
|---|---|
| npm ci --ignore-scripts | PASS, clean lockfile install; no install-script security bypass or approval override |
| npm run lint | PASS |
| npm run typecheck | PASS |
| npm run build | PASS; build includes strict typecheck |
| npm test | PASS, 18 files / 202 tests |
| npm run test:e2e | PASS, 44 cases across Desktop Chrome and Pixel5 emulation |
| npm run check | PASS, including post-review forecast-first viewport assertion |
| npm audit | PASS, zero findings |
| npm audit --omit=dev | PASS, zero findings |
| npm run perf:local | PASS, three measured local mobile-context samples; see PERFORMANCE.md |
| git diff --check | PASS |
| Changed-file credential-pattern scan | No matches; locations-only scan, not an exhaustive secret-history certification |
| Live unauthenticated Open-Meteo GET through production adapter | PASS, validated168 hours/7days, 2026-10-18 through2026-10-24, metric units; model reference time remains null |
| Local SVG icon/manifest/worker HTTP and MIME | PASS, HTTP200 with SVG/JSON/JavaScript MIME |

A final favicon-only HTML update was built and inspected after the complete browser run; application JS/CSS and behavior remained identical to that run. Core desktop/mobile light/dark screenshots were visually inspected. The viewport check ensures the temperature is initially visible in the tested desktop/mobile contexts.

Browser evidence includes deterministic normal/error forecasts, severe hourly wind, same-region destination city, departure-window output changes, keyboard search and day tabs, 320/390/768/1440px overflow, core light/dark WCAG AA-tagged axe scans, city-aware deterministic assistant, Reality coordinates/Escape, saved/shared context, denied storage, actual worker activation/cache cleanup and offline30-minute expiry. No automated accessibility violations in the scanned core states; no complete WCAG certification claimed.

Initial errors were repaired and rerun: baseline13 TypeScript errors; critical-hazard window averaging; outdated unsafe simulation expectations; exact-city ranking; narrow native-select overflow; contrast/list/scroll-focus semantics; holiday year boundary; stale accessible save-button name; and incomplete performance timing under a fake clock. Copied legacy tests were replaced with production imports/request tests; test counts reflect meaningful coverage changes, not coverage percentages.

Not executed: Vercel preview/production deployment, remote pushes/merges, live environment changes, real emergency calls, comprehensive live imagery/radar/OSM/Archive/AQI checks, Firefox/Safari/real-device testing, human screen-reader audit, Lighthouse or production telemetry. These are explicit owner-review/preview items, not passing claims.

Known nonblocking debt: detailed tools remain English/Taglish; Recharts2 emitted an inactive-branch deprecation warning during clean install (no registry advisory at execution); CSP is report-only; no error-monitoring collector/CI publication was configured; catalog and emergency contacts need authoritative content review. Official ingestion, operational shelter data, fares/traffic and background notifications are deliberately not implemented.
