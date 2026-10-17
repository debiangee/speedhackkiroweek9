# Implemented feature inventory

All primary surfaces use section navigation on `/`, not a new router.

| Section | Implementation | Provider / limitation |
|---|---|---|
| Overview | Current-hour forecast, next six hours, city/region choice, saved places, share | Open-Meteo model; no station observation claim |
| Forecast | Day tabs, hourly values, optional chart/history, comparison | Daily probability is hourly mean; history is previous-year calendar period, not climatology |
| Trip Planner | Destination, day/departure, up-to-three-hour or remaining-day suitability, factors | Conservative product heuristics; no road/flood/traffic validation |
| Activity tools | Remaining-hour ranking, best/worst windows, optimizer | No trail, sea, flood or road operational data |
| Demand estimate | Weather/calendar/AQI heuristic scores and qualitative mode context | No actual prices, traffic or driver feed |
| Weather Maps | On-demand radar, regional reference heatmap, SVG explorer, imagery simulation | Provider coverage may be unavailable; imagery can predate forecast |
| Official Sources | PAGASA directory and clear authority distinction | No ingestion, no synthesized TCWS/rainfall warnings |
| Emergency Resources | Static contacts and on-demand mapped facilities | Telephone data and facility operations require local confirmation |
| Kuya Weather | Deterministic intent/location/forecast explanation service | No LLM; unknown requests refused; flood operations unknown |
| Preferences | Local saved city/region IDs, legacy favorites migration, theme/language/lightweight | No account; storage optional, max12 saved places |
| Sharing | Validated location/date URLs and native/clipboard sharing | Link retrieves current forecast; not a permanent weather snapshot |
| Offline behavior | Loaded/fresh-cache use, explicit offline notice, strict expiry | No offline navigation or background notification delivery |

Deprecated presentations: synthetic official warning panel, always-active seasonal warning, unsupported transport multipliers/savings UI and flood-safety assurances. Their useful planning intent is retained in accurately labeled views. Dormant historical modules may remain in source; unreferenced modules are not advertised as active features.
