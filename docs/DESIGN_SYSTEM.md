# Design foundations

Shared CSS custom properties in src/index.css provide semantic backgrounds, text, accents, status colors, radius, shadow and motion. Never use color alone to convey weather meaning. Use semantic headings, native controls, visible focus and comfortable targets. Prefer forecast validity/source labels over decorative badges.

Forecasts are not observations or official alerts. Unknown data is neutral and explicit. No invented values in skeletons. Respect reduced motion in CSS and canvas. Load heavy maps and imagery on user demand.

Primary sections: Overview, Forecast, Trip Planner, Weather Maps, Official Sources & Emergency Resources, Kuya Weather. Prefer section navigation over additional router infrastructure. Language controls must reflect actual translated scope.
