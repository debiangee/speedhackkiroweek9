# Release candidate checklist — owner authorization required

## Local engineering gate

1. Work from the populated canonical repository, never the nested repository.
2. Record `git branch --show-current`, `git rev-parse HEAD`, `git status --short`.
3. Use the lockfile and supported Node version; run `npm ci`, `npm run check`, `npm audit`, `npm audit --omit=dev`.
4. Inspect the complete diff against starting commit `7b9ddcc165aa3dfd195c39f6d33c7a43eeb6c219`. Exclude local `.ai-handoff/`, generated reports/builds, credentials and the nested repository.
5. Review docs/PERFORMANCE.md and the generated browser report. Automated results do not replace human language, screen-reader, real-device and provider review.

## Owner-controlled preview gate (NOT EXECUTED by the modernization)

No remote push, merge, Vercel deployment or environment changes were authorized. The existing public deployment remains unchanged; local safety corrections are not live until an authorized release.

After owner approval, use an owner-managed preview associated with the reviewed branch/SHA. Confirm:

- Vercel project/repository/root identity; root must contain this package.json, not the nested repository.
- Supported Node 24.x setting; build `npm run build`, output `dist`, Vite detection and SPA rewrite from vercel.json.
- Required core environment variables: none. Optional public Maps key restrictions/API/billing if enabled. CI affects only test execution settings.
- Immutable hashed assets; fresh HTML and no-cache/no-store sw.js; manifest delivered as JSON rather than fallback HTML.
- Official-source links resolve, no generated official advisories exist, and emergency facility labels remain unverified.
- Real Open-Meteo forecast, archive, AQI, radar coverage/tiles, Google imagery fallback, Esri/OSM and Overpass availability/attribution.
- Desktop/tablet/real phone, light/dark, English/Filipino, keyboard and screen-reader journeys.
- Existing installed browser upgrades: legacy owned caches removed, unrelated caches preserved, no stale radar interception, offline expiry understandable.
- Inspect report-only CSP console violations before considering enforcement. Do not enforce until real provider paths/analytics are verified. No report collector is configured.
- Confirm emergency numbers via official directories; never make test calls to emergency lines.

## Production smoke after separately authorized deployment

Verify reviewed SHA/artifact identity; HTTP status/MIME for HTML, hashed assets, manifest and worker; one location and a different same-region city; current PHT hour; selected day/departure; share/reload; official sources; maps failure; cached/offline expiry; console/runtime errors. Inspect only safe reads; do not send messages or mutate external services.

## Rollback

Record the previously approved safe deployment/artifact and responsible owner before release. Roll back only to a reviewed artifact retaining the forecast safety corrections and migration worker. Blind rollback to the original warning/cache implementation would restore known defects. If no safe rollback artifact exists, prepare and review a corrective release or disable affected integrations; do not force-reset history.

Repeat smoke and installed-worker/cache checks after rollback. The worker's network-only policy intentionally avoids pinning an old shell, but actual Vercel/browser upgrade behavior must be confirmed on the authorized preview. No rollback or deployment was performed here.
