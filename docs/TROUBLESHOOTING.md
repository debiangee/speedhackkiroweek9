# Troubleshooting

- **Wrong directory / no package.json:** use the populated parent repository. Do not initialize, delete or modify the separate nested repository.
- **Unsupported runtime:** `nvm use`; Node24.18.0 was tested. Node18 does not satisfy this test toolchain.
- **Forecast unavailable:** inspect connectivity/provider status and retry. Partial or invalid responses are deliberately rejected. Old/expired forecasts are not substituted.
- **Offline:** already loaded fresh caches may work, but navigation/reload is not promised offline. Connect and reload when needed. The worker intentionally stopped legacy indefinite caching.
- **No map/radar:** turn off lightweight mode, select the tool, and check connectivity/provider availability. Empty radar coverage is not evidence of no rain. Text forecasts remain independent.
- **Street imagery missing:** use map view or the external Google Maps link. Coverage and the no-key legacy embed are not guaranteed. Optional browser key needs owner-managed restrictions.
- **Shared old link:** unsupported dates/locations fall back visibly to a valid forecast period. Shared URLs are not archived snapshots.
- **Preferences not retained:** browser storage may be denied or full. Forecast and navigation should still work. Saved locations are local to that browser/profile.
- **Playwright cannot launch:** run `npx playwright install chromium`. Run a build before browser tests. Check port4173 ownership rather than stopping unrelated processes.
- **Fixture vs live data:** automated browser tests intercept providers intentionally. A local live-provider smoke is separate; see validation records. No mocked result proves operational hazard or facility accuracy.
- **License/provider terms or emergency numbers:** confirm with the project owner/issuing authority before release. Documentation is not a verification of third-party operations.
