import { useState, useEffect, lazy, Suspense, type ReactNode } from 'react';
import { useWeatherData } from '../hooks/useWeatherData';
import { useFavorites } from '../hooks/useFavorites';
import { useGeolocation } from '../hooks/useGeolocation';
import { useClock } from '../hooks/useClock';
import { useLocale } from '../hooks/useLocale';
import { RegionSearch } from './RegionSearch';
import { LocationDetect } from './LocationDetect';
import { FavoriteRegions } from './FavoriteRegions';
import { WeatherSignalPanel } from './WeatherSignalPanel';
import { EmergencyHotlines } from './EmergencyHotlines';
import { DayCards } from './DayCards';
import { HourlyTimeline } from './HourlyTimeline';
import { CitySelector } from './CitySelector';
import { StarButton } from './StarButton';
import { ShareForecast } from './ShareForecast';
import { TripGoChecker } from './TripGoChecker';
import { ActivityPlanner } from './ActivityPlanner';
import { BestTimeToGo } from './BestTimeToGo';
import { SmartRecommendations } from './SmartRecommendations';
import { OptimizationPanel } from './OptimizationPanel';
import { ErrorBoundary } from './ErrorBoundary';
import { SkeletonLoader } from './SkeletonLoader';
import { CloudRainIcon, ThermometerIcon, WindIcon, DropletIcon } from './Icons';
import { resolveLocation } from '../utils/locations';
import { manilaDate, currentForecastIndex, remainingForecast } from '../utils/time';
import './Dashboard.css';
import './ModernDashboard.css';
const RainChart = lazy(() => import('./RainChart').then(m => ({default:m.RainChart})));
const WeatherChatbot = lazy(() => import('./WeatherChatbot').then(m => ({default:m.WeatherChatbot})));
const CompareRegions = lazy(() => import('./CompareRegions').then(m => ({default:m.CompareRegions})));
const HistoricalComparison = lazy(() => import('./HistoricalComparison').then(m => ({default:m.HistoricalComparison})));
const TransportSurgePredictor = lazy(() => import('./TransportSurgePredictor'));
const WeatherReality = lazy(() => import('./WeatherReality/WeatherReality').then(m => ({default:m.WeatherReality})));
const WeatherRiskMap = lazy(() => import('./WeatherRiskMap').then(m => ({default:m.WeatherRiskMap})));
const RainHeatmap = lazy(() => import('./RainHeatmap').then(m => ({default:m.RainHeatmap})));
const PhilippineMap = lazy(() => import('./PhilippineMap').then(m => ({default:m.PhilippineMap})));
const EvacuationPanel = lazy(() => import('./EvacuationPanel').then(m => ({default:m.EvacuationPanel})));

function DeferredDetails({title, children}: {title: ReactNode; children: ReactNode}) {
  const [open, setOpen] = useState(false);
  return <details onToggle={e => setOpen(e.currentTarget.open)}><summary>{title}</summary>{open && children}</details>;
}
function weatherLabel(code: number, fil: boolean): string {
  if (code >= 95) return fil ? 'May thunderstorm sa forecast' : 'Thunderstorm forecast';
  if (code >= 51 && code <= 82) return fil ? 'May ulan sa forecast' : 'Rain in the forecast';
  if (code >= 45 && code <= 48) return fil ? 'Maulap na may hamog' : 'Foggy conditions';
  if (code <= 1) return fil ? 'Maaliwalas' : 'Mostly clear';
  return fil ? 'Maulap' : 'Cloudy';
}
export function Dashboard() {
  const now = useClock();
  const { locale } = useLocale();
  const text = (en: string, fil: string) => locale === 'fil' ? fil : en;
  const [selectedRegion, setSelectedRegion] = useState('NCR');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(manilaDate);
  const [compareMode, setCompareMode] = useState(false);
  const [mapTool, setMapTool] = useState('');
  const [facilities, setFacilities] = useState(false);
  const [assistant, setAssistant] = useState(false);
  const { favorites, toggleFavorite, removeFavorite, isFavorite } = useFavorites();
  const { detecting, error: geoError, detect } = useGeolocation();
  const location = resolveLocation(selectedRegion, selectedCity)!;
  const { loading, error, hourly, daily, lastUpdated, refetch } = useWeatherData(selectedRegion, location);
  function select(region: string, city?: string) { setSelectedRegion(region); setSelectedCity(city || null); }
  useEffect(() => {
    if (selectedDate < manilaDate(new Date(now))) setSelectedDate(manilaDate(new Date(now)));
  }, [now, selectedDate]);
  useEffect(() => {
    const trigger = (event: Event) => {
      const detail = (event as CustomEvent<{region?: string}>).detail;
      if (detail.region && resolveLocation(detail.region)) { setSelectedRegion(detail.region); setSelectedCity(null); }
      setMapTool('reality');
      document.getElementById('weather-maps')?.scrollIntoView({behavior:'instant'});
    };
    window.addEventListener('weather-reality-trigger', trigger);
    return () => window.removeEventListener('weather-reality-trigger', trigger);
  }, []);
  const current = hourly[currentForecastIndex(hourly, now)];
  const dayHours = hourly.filter(h => h.date === selectedDate);
  const upcoming = remainingForecast(dayHours, now);
  return <div className="dashboard modern-dashboard">
    <section id="overview" className="product-section" aria-labelledby="overview-title">
      <div className="section-intro"><div><p className="eyebrow">{text('YOUR DAY, WITH CONTEXT','ANG ARAW MO, MAY GABAY')}</p><h2 id="overview-title">{text('A clearer view of your day.','Mas malinaw na plano sa araw mo.')}</h2><p>{text('Forecasts for everyday plans across the Philippines.','Taya ng panahon para sa araw-araw na plano sa Pilipinas.')}</p></div><span className="timezone-chip">Asia/Manila · PHT</span></div>
      <div className="dashboard-search"><RegionSearch selected={selectedRegion} onSelect={select}/><LocationDetect detecting={detecting} error={geoError} onDetect={async () => { const found = await detect(); if (found) select(found.region, found.city); }}/></div>
      <div className="location-heading"><h3>{location.name}</h3><StarButton isFavorite={isFavorite(selectedRegion)} onClick={() => toggleFavorite(selectedRegion)} label={isFavorite(selectedRegion) ? text('Saved region','Naka-save na rehiyon') : text('Save region','I-save ang rehiyon')}/><ShareForecast region={selectedRegion} selectedCity={selectedCity} daily={daily}/></div>
      <p className="data-note">{text('Representative forecast point; conditions can vary nearby.','Kinatawang lokasyon ng forecast; maaaring iba ang panahon sa kalapit na lugar.')}</p>
      <details><summary>{text('Choose a city (optional)','Pumili ng lungsod (opsyonal)')}</summary><CitySelector region={selectedRegion} selectedCity={selectedCity} onSelectCity={setSelectedCity}/></details>
      <FavoriteRegions favorites={favorites} selected={selectedRegion} onSelect={select} onRemove={removeFavorite}/>
      {loading ? <SkeletonLoader/> : error ? <div className="error-state" role="alert"><h3>{text('Forecast unavailable','Hindi makuha ang forecast')}</h3><p>{error}</p><p>{text('No expired forecast or favorable default is substituted. Check official sources below.','Hindi gumagamit ng lumang forecast o imbentong magandang kondisyon. Tingnan ang opisyal na sanggunian sa ibaba.')}</p><button className="retry-btn" onClick={refetch}>{text('Try again','Subukan muli')}</button></div> : current ? <>
        <div className="conditions-hero"><div className="conditions-primary"><p>{text('FORECAST FOR THIS HOUR · NOT AN OBSERVATION','TAYA PARA SA ORAS NA ITO · HINDI AKTUWAL NA OBSERBASYON')}</p><div className="hero-temperature">{Math.round(current.temperature)}<span>°C</span></div><h3>{weatherLabel(current.weather_code, locale === 'fil')}</h3><p>{current.date} · {String(current.hour).padStart(2,'0')}:00 PHT</p></div>
        <dl className="conditions-grid"><div><dt><CloudRainIcon/>{text('Rain probability','Tsansa ng ulan')}</dt><dd>{current.precipitation_probability}%</dd></div><div><dt><DropletIcon/>{text('Hourly precipitation','Ulan sa isang oras')}</dt><dd>{current.precipitation} mm</dd></div><div><dt><WindIcon/>{text('Wind / gusts','Hangin / pagbugso')}</dt><dd>{current.wind_speed} / {current.wind_gusts} km/h</dd></div><div><dt><ThermometerIcon/>{text('Humidity','Halumigmig')}</dt><dd>{current.humidity}%</dd></div></dl></div>
        <p className="freshness" role="status">{lastUpdated}</p><p className="data-note">{text('Hourly model forecasts from Open-Meteo, not a live sensor or official warning.','Oras-oras na model forecast mula sa Open-Meteo, hindi live sensor o opisyal na babala.')}</p>
        <div className="next-hours"><h3>{text('The next few hours','Mga susunod na oras')}</h3><HourlyTimeline hourly={remainingForecast(hourly,now).slice(0,6)}/></div>
      </> : <p role="status">{text('No forecast for this hour. Refresh or check official sources.','Walang forecast para sa oras na ito. I-refresh o tingnan ang opisyal na sanggunian.')}</p>}
    </section>
    <section id="forecast" className="product-section" aria-labelledby="forecast-title"><div className="section-intro"><div><p className="eyebrow">{text('LOOK AHEAD','MAGPLANO')}</p><h2 id="forecast-title">{text('Your forecast','Taya ng panahon')}</h2><p>{text('Select a day to explore hourly conditions. Daily percentages are mean hourly probabilities, not a whole-day probability.','Pumili ng araw para makita ang bawat oras. Ang porsiyento sa araw ay average ng oras-oras na tsansa ng ulan.')}</p></div><button onClick={() => setCompareMode(v => !v)} aria-expanded={compareMode}>{text('Compare locations','Ihambing ang mga lugar')}</button></div>
      {compareMode && <ErrorBoundary><Suspense fallback={<p role="status">{text('Loading comparison…','Kinukuha ang paghahambing…')}</p>}><CompareRegions date={selectedDate} onClose={() => setCompareMode(false)}/></Suspense></ErrorBoundary>}
      {!loading && !error && daily.length > 0 ? <><DayCards daily={daily} selectedDate={selectedDate} onSelectDate={setSelectedDate}/><h3>{selectedDate} · PHT</h3><HourlyTimeline hourly={dayHours}/><DeferredDetails title={<>{text('Weekly rain chart and previous-year comparison','Tsart ng ulan at paghahambing sa nakaraang taon')}</>}><ErrorBoundary><Suspense fallback={<p>Loading charts…</p>}><RainChart daily={daily}/><HistoricalComparison daily={daily} region={selectedRegion} coords={location}/></Suspense></ErrorBoundary></DeferredDetails></> : <p>{text('Forecast details appear when valid data is available.','Lalabas ang detalye kapag may wastong datos.')}</p>}
    </section>
    <section id="trip-planner" className="product-section" aria-labelledby="trip-title"><div className="section-intro"><div><p className="eyebrow">{text('PLAN WITH CARE','MAINGAT NA PAGPAPLANO')}</p><h2 id="trip-title">{text('Trip & activity planner','Plano sa biyahe at aktibidad')}</h2><p>{text('Weather suitability, not a guarantee of road or travel safety.','Gabay batay sa forecast, hindi garantiya ng kaligtasan sa kalsada o biyahe.')}</p></div></div>
      <ErrorBoundary><TripGoChecker region={selectedRegion} hourly={hourly} daily={daily}/></ErrorBoundary>
      {!loading && !error && daily.length > 0 && <><DeferredDetails title={<>{text('Activities and best weather windows','Mga aktibidad at angkop na oras')}</>}><ActivityPlanner hourly={remainingForecast(hourly,now)} daily={daily}/><h3>{selectedDate} · PHT</h3><BestTimeToGo hourly={upcoming}/><OptimizationPanel hourly={upcoming} daily={daily} region={selectedRegion}/></DeferredDetails><DeferredDetails title={<>{text('Forecast-derived planning indicators','Mga gabay mula sa forecast')}</>}><SmartRecommendations hourly={upcoming} region={selectedRegion}/><Suspense fallback={<p>Loading…</p>}><TransportSurgePredictor region={selectedRegion} hourly={hourly} daily={daily} cityCoords={location}/></Suspense></DeferredDetails></>}
    </section>
    <section id="weather-maps" className="product-section" aria-labelledby="maps-title"><div className="section-intro"><div><p className="eyebrow">{text('EXPLORE','TUKLASIN')}</p><h2 id="maps-title">{text('Weather maps','Mga mapa ng panahon')}</h2><p>{text('Maps and imagery load only when requested. Text forecasts remain available above.','Kukunin lang ang mapa at larawan kapag pinili. Nasa itaas ang tekstong forecast.')}</p></div></div>
      <div className="map-tools" role="group" aria-label={text('Map tools','Mga mapa')}>{[['radar',text('Rain radar','Radar ng ulan')],['heatmap',text('Forecast heatmap','Mapa ng taya ng ulan')],['regions',text('Region explorer','Mga rehiyon')],['reality','Weather Reality']].map(([id,label]) => <button key={id} onClick={() => setMapTool(mapTool === id ? '' : id)} aria-pressed={mapTool === id}>{label}</button>)}</div>
      {mapTool && <ErrorBoundary key={mapTool}><Suspense fallback={<p role="status">{text('Loading map…','Kinukuha ang mapa…')}</p>}>{mapTool === 'radar' ? <WeatherRiskMap/> : mapTool === 'heatmap' ? <RainHeatmap/> : mapTool === 'regions' ? <PhilippineMap selected={selectedRegion} onSelect={select}/> : hourly.length ? <WeatherReality region={selectedRegion} selectedCity={selectedCity} hourly={hourly}/> : <p>{text('Valid forecast required for weather simulation.','Kailangan ng wastong forecast para sa simulation.')}</p>}</Suspense></ErrorBoundary>}
    </section>
    <section id="preparedness" className="product-section" aria-labelledby="preparedness-title"><div className="section-intro"><div><p className="eyebrow">{text('TRUSTED SOURCES','MGA SANGGUNIAN')}</p><h2 id="preparedness-title">{text('Official sources & emergency resources','Opisyal na sanggunian at tulong sa emergency')}</h2><p>{text('Use issuing authorities for warnings and local officials for operational information.','Sumangguni sa awtoridad para sa babala at sa lokal na pamahalaan para sa aktuwal na sitwasyon.')}</p></div></div><WeatherSignalPanel region={selectedRegion}/><EmergencyHotlines region={selectedRegion}/><button onClick={() => setFacilities(v => !v)} aria-expanded={facilities}>{text('Find mapped facilities — status unverified','Hanapin ang mga pasilidad — hindi beripikado ang katayuan')}</button>{facilities && <ErrorBoundary><Suspense fallback={<p>Loading mapped facilities…</p>}><EvacuationPanel lat={location.lat} lon={location.lon} region={location.name}/></Suspense></ErrorBoundary>}</section>
    <section id="kuya-weather" className="product-section" aria-labelledby="kuya-title"><div className="section-intro"><div><p className="eyebrow">KUYA WEATHER</p><h2 id="kuya-title">{text('A little help reading the forecast','Tulong sa pag-unawa ng forecast')}</h2><p>{text('A deterministic, rule-based guide using Open-Meteo. No generative AI, official alert feed or road-status service. Detailed legacy tools may use English or Taglish.','Gabay na may nakatakdang mga tuntunin gamit ang Open-Meteo. Walang generative AI, opisyal na alert feed o serbisyo sa katayuan ng kalsada. Maaaring Ingles o Taglish ang ilang detalyadong tool.')}</p></div></div><button onClick={() => setAssistant(v => !v)} aria-expanded={assistant}>{text('Open forecast guide','Buksan ang gabay')}</button>{assistant && <ErrorBoundary><Suspense fallback={<p>Loading guide…</p>}><WeatherChatbot selectedRegion={selectedRegion}/></Suspense></ErrorBoundary>}</section>
  </div>;
}
