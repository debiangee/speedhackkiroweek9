import './WeatherSignalPanel.css';
/** Official-source directory only. No forecast value is an official bulletin. */
export function WeatherSignalPanel({ region }: { region: string; cityCoords?: { lat: number; lon: number } | null }) {
  return <section className="section-card" aria-label="Official weather sources">
    <h2>Official advisories</h2>
    <p>For {region}, check the affected areas and issue time in the official bulletin. This app does not ingest official warnings.</p>
    <p><a href="https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin" target="_blank" rel="noopener noreferrer">PAGASA tropical cyclone bulletins</a>{' · '}
    <a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noopener noreferrer">PAGASA weather, rainfall and flood information</a></p>
    <p>Forecast-based planning guidance below is not a TCWS, rainfall warning, flood warning, or evacuation instruction.</p>
  </section>;
}
export default WeatherSignalPanel;
