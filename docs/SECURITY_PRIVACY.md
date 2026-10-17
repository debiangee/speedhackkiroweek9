# Security, privacy and operational limits

## Browser data
Geolocation is optional and user initiated. Raw GPS is matched to a bounded catalog on-device; providers receive representative forecast coordinates. Local saved locations, current selection, theme/language and fresh forecasts use optional browser storage. Denied storage is nonfatal. Forecast persistence is bounded to 64 entries and 30 minutes; expired data is not used for guidance. Shape/range validation does not make browser storage tamperproof.

Assistant questions stay in memory on the device; only resolved weather coordinates are requested. There are no accounts, payments or user database. Vercel Analytics remains installed; beforeSend removes query/fragment location/date context from event URLs. Provider/analytics-side retention is governed by those services, not verified here.

Google Maps, Esri, OSM/CARTO, RainViewer and Overpass load only when their tools are requested. No external font downloads. Optional VITE_GOOGLE_MAPS_API_KEY is a public browser key, not a server secret: if configured, the owner must restrict allowed origins/APIs and review quotas/billing. Do not store privileged credentials in VITE variables.

## Headers
Vercel declares nosniff, strict-origin-when-cross-origin referrer policy, self-only geolocation and disabled camera/microphone, and frame denial for this application. Preview uses the same global header declarations for browser validation.

CSP is deliberately report-only pending owner preview validation of real third-party imagery/analytics; it is not represented as enforced protection. Do not switch to enforcement until actual provider paths and policy reports are reviewed. No reporting collector exists; browser console reports alone are not monitoring.

## Worker and rollback
Migration worker removes owned legacy caches only and does not intercept fetch. It claims clients to stop unbounded legacy caching. sw.js has no-cache/no-store deployment headers. Offline navigation/background notifications are not supported. An already loaded tab can use an unexpired cached forecast and shows an offline notice.

Do not roll back to the unsafe legacy service worker/warning implementation. A rollback artifact must retain the migration worker and safety corrections. Production update/rollback behavior still needs owner-authorized preview checks on Vercel; none was deployed during modernization.

## Dependency gate
Use the committed npm lockfile and supported Node version. Run npm audit and npm audit --omit=dev. Zero registry findings at execution time is not a guarantee against future vulnerabilities. Do not expose development/test servers to untrusted networks.
