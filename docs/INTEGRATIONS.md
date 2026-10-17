# Integrations and deferred capabilities

Implemented: Open-Meteo forecast validation/shared requests, previous-year archive comparison, optional AQI, RainViewer radar, on-demand Google Street View/Esri/OSM/CARTO maps, Overpass facility candidates, official PAGASA source links, local saved cities/regions, share URLs, lightweight mode.

No verified official ingestion adapter/contract or operational shelter registry is configured. The official-source directory is the implemented fallback. It does not declare whether an official warning exists or does not exist. Source authorities must be consulted for geography, issuance and validity.

Mapped OSM facilities are candidates only. No opening, capacity, accessibility, availability or safety guarantees. Emergency telephone records are static and should be confirmed against government directories; do not call test emergency numbers.

No transport fare/traffic service, road safety verification, generative AI, authentication, paid weather API, or background notification delivery. Reminders are deferred because no push subscription/delivery infrastructure or delivery guarantee exists. No fake notification timers were added.

Locations are a curated city/region catalog, not comprehensive barangay coverage or street-level model precision. Search aliases resolve catalog points. GPS stays on-device and rejects unsupported coverage before choosing a catalog city.

English/Filipino cover primary navigation, overview and selected controls; detailed legacy tools retain English/Taglish, disclosed in the guide section. Broader localization and human language review remain owner-review work.
