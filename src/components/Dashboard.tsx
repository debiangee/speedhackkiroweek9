import { useClock } from '../hooks/useClock';
import { REGION_COORDS } from '../utils/locations';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useWeatherData } from '../hooks/useWeatherData';
import { useFavorites } from '../hooks/useFavorites';
import { useGeolocation } from '../hooks/useGeolocation';
import { PhilippineMap } from './PhilippineMap';
import { RegionSearch } from './RegionSearch';
import { LocationDetect } from './LocationDetect';
import { FavoriteRegions } from './FavoriteRegions';
import { TyphoonBanner } from './TyphoonBanner';
import { WeatherAlerts } from './WeatherAlerts';
import { WeatherSignalPanel } from './WeatherSignalPanel';
import { EvacuationPanel } from './EvacuationPanel';
import { BestTimeToGo } from './BestTimeToGo';
import { SmartRecommendations } from './SmartRecommendations';
import { OptimizationPanel } from './OptimizationPanel';
import { EmergencyHotlines } from './EmergencyHotlines';
import { DayCards } from './DayCards';
import { HourlyTimeline } from './HourlyTimeline';
import { TravelAdvice } from './TravelAdvice';
import { CitySelector } from './CitySelector';
import { StarButton } from './StarButton';
import { ShareForecast } from './ShareForecast';
import { TripGoChecker } from './TripGoChecker';
import { WeekSummaryCard } from './WeekSummaryCard';
import { ActivityPlanner } from './ActivityPlanner';
import { RainHeatmap } from './RainHeatmap';
import { WeatherRiskMap } from './WeatherRiskMap';
import { CalendarIcon, ClockIcon, TrendingUpIcon, SunIcon, AlertCircleIcon, MapPinIcon, DropletIcon } from './Icons';
import { ErrorBoundary } from './ErrorBoundary';
import { SkeletonLoader } from './SkeletonLoader';
import { getRegionLabel } from '../utils/regions';
import { getCityCoords } from '../utils/cities';
import './Dashboard.css';
import { manilaDate, manilaHour } from '../utils/time';

// Lazy load heavy components
const RainChart = lazy(() => import('./RainChart').then((m) => ({ default: m.RainChart })));
const WeatherChatbot = lazy(() => import('./WeatherChatbot').then((m) => ({ default: m.WeatherChatbot })));
const CompareRegions = lazy(() => import('./CompareRegions').then((m) => ({ default: m.CompareRegions })));
const HistoricalComparison = lazy(() => import('./HistoricalComparison').then((m) => ({ default: m.HistoricalComparison })));
const TransportSurgePredictor = lazy(() => import('./TransportSurgePredictor'));
const WeatherReality = lazy(() => import('./WeatherReality/WeatherReality').then((m) => ({ default: m.WeatherReality })));

// Region coordinates for historical comparison


export function Dashboard() {
  useClock();
  const [selectedRegion, setSelectedRegion] = useState('NCR');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => manilaDate());
  const [compareMode, setCompareMode] = useState(false);
  const [realityHourOffset, setRealityHourOffset] = useState(0);
  const { favorites, toggleFavorite, removeFavorite, isFavorite } = useFavorites();
  const { detecting, error: geoError, detect } = useGeolocation();

  useEffect(() => {
    const interval = setInterval(() => { setSelectedDate(date => date < manilaDate() ? manilaDate() : date); }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listen for Kuya Weather reality simulation triggers
  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ region?: string; hourOffset?: number }>;
      if (customEvent.detail?.region && customEvent.detail.region !== selectedRegion) {
        setSelectedRegion(customEvent.detail.region);
        setSelectedCity(null);
      }
      if (typeof customEvent.detail?.hourOffset === 'number') {
        setRealityHourOffset(customEvent.detail.hourOffset);
      }
    };
    window.addEventListener('weather-reality-trigger', handleTrigger);
    return () => window.removeEventListener('weather-reality-trigger', handleTrigger);
  }, [selectedRegion]);

  // Get city coordinates if a city is selected, otherwise use region center
  const cityCoords = selectedCity ? getCityCoords(selectedRegion, selectedCity) : null;
  const { loading, error, hourly, daily, lastUpdated, refetch } = useWeatherData(selectedRegion, cityCoords);

  function handleRegionSelect(region: string, city?: string) {
    setSelectedRegion(region);
    setSelectedCity(city || null);
  }

  async function handleDetectLocation() {
    const result = await detect();
    if (result) {
      setSelectedRegion(result.region);
      setSelectedCity(result.city);
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <TyphoonBanner />
        <div className="dashboard-search">
          <RegionSearch selected={selectedRegion} onSelect={handleRegionSelect} />
          <LocationDetect detecting={detecting} onDetect={handleDetectLocation} error={geoError} />
        </div>
        {favorites.length > 0 && (
          <FavoriteRegions favorites={favorites} selected={selectedRegion} onSelect={handleRegionSelect} onRemove={removeFavorite} />
        )}
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <PhilippineMap selected={selectedRegion} onSelect={handleRegionSelect} />
          </aside>
          <section className="dashboard-content">
            <SkeletonLoader />
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <TyphoonBanner />
        <div className="dashboard-search">
          <RegionSearch selected={selectedRegion} onSelect={handleRegionSelect} />
          <LocationDetect detecting={detecting} onDetect={handleDetectLocation} error={geoError} />
        </div>
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <PhilippineMap selected={selectedRegion} onSelect={handleRegionSelect} />
          </aside>
          <section className="dashboard-content">
            <div className="error-state">
              <p>Could not load weather data</p>
              <span className="error-detail">{error}</span>
              <button className="retry-btn" onClick={refetch}>Try Again</button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const todayHourly = hourly.filter((h) => h.date === selectedDate);
  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Compute current conditions for weather alerts
  const currentHour = manilaHour();
  const recentHourly = todayHourly.filter((h) => Math.abs(h.hour - currentHour) <= 2);
  const maxWind = recentHourly.length > 0 ? Math.max(...recentHourly.map((h) => h.wind_speed)) : 0;
  const maxRain = recentHourly.length > 0 ? recentHourly.reduce((s, h) => s + h.precipitation, 0) : 0;

  const regionCoords = REGION_COORDS[selectedRegion] || REGION_COORDS['NCR'];

  return (
    <div className="dashboard">
      <TyphoonBanner />

      {/* Real-time weather alerts & storm signals */}
      <WeatherAlerts windSpeed={maxWind} rainMm={maxRain} region={selectedRegion} />
      <WeatherSignalPanel region={selectedRegion} cityCoords={cityCoords} />

      <div className="dashboard-search">
        <RegionSearch selected={selectedRegion} onSelect={handleRegionSelect} />
        <LocationDetect detecting={detecting} onDetect={handleDetectLocation} error={geoError} />
      </div>

      {favorites.length > 0 && (
        <FavoriteRegions
          favorites={favorites}
          selected={selectedRegion}
          onSelect={handleRegionSelect}
          onRemove={removeFavorite}
        />
      )}

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <PhilippineMap selected={selectedRegion} onSelect={handleRegionSelect} />

          {/* Rain Heatmap */}
          <div className="section-card sidebar-card">
            <div className="section-header">
              <DropletIcon size={16} color="var(--accent)" />
              <h3 className="section-title">Rain Heatmap</h3>
            </div>
            <RainHeatmap />
          </div>
        </aside>

        <section className="dashboard-content">
          {/* Actions */}
          <div className="region-actions">
            <StarButton
              isFavorite={isFavorite(selectedRegion)}
              onClick={() => toggleFavorite(selectedRegion)}
              label={isFavorite(selectedRegion) ? 'Saved' : 'Save'}
            />
            <button
              className={`compare-btn ${compareMode ? 'active' : ''}`}
              onClick={() => setCompareMode(!compareMode)}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Compare
            </button>
            <ShareForecast region={selectedRegion} daily={daily} selectedCity={selectedCity} />
            {lastUpdated && (
              <span className="last-updated">Updated: {lastUpdated}</span>
            )}
          </div>

          {/* Compare mode */}
          {compareMode && (
            <ErrorBoundary>
              <Suspense fallback={<p className="lazy-loading">Loading comparison...</p>}>
                <CompareRegions
                  date={selectedDate}
                  onClose={() => setCompareMode(false)}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {/* City selector */}
          <div className="section-card">
            <div className="section-header">
              <MapPinIcon size={18} color="var(--accent)" />
              <h2 className="section-title">
                {selectedCity || getRegionLabel(selectedRegion)}
              </h2>
            </div>
            <p className="section-desc">Select a specific city for more accurate forecast</p>
            <CitySelector
              region={selectedRegion}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
            />
          </div>

          {/* Weather Reality — Real-Time First-Person 3D Weather Simulation */}
          <div id="weather-reality-section">
            <ErrorBoundary>
              <Suspense fallback={<p className="lazy-loading">Loading Weather Reality simulation...</p>}>
                <WeatherReality
                  region={selectedRegion}
                  selectedCity={selectedCity}
                  hourly={hourly}
                  initialForecastHourOffset={realityHourOffset}
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Week at a Glance */}
          <div className="section-card">
            <div className="section-header">
              <CalendarIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Week at a Glance</h2>
            </div>
            <p className="section-desc">7-day rain probability, temperatures, and best days for outdoor plans</p>
            <WeekSummaryCard daily={daily} region={selectedRegion} />
          </div>

          {/* Travel advice */}
          <TravelAdvice hourly={todayHourly} region={selectedRegion} />

          {/* Trip Go Checker */}
          <div className="section-card section-card-highlight">
            <div className="section-header">
              <MapPinIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Trip Go Checker</h2>
              <span className="section-badge">Go / No-Go</span>
            </div>
            <p className="section-desc">Enter your destination — we'll tell you if it's worth the trip</p>
            <TripGoChecker hourly={hourly} daily={daily} region={selectedRegion} />
          </div>

          {/* Smart Optimizer */}
          <div className="section-card section-card-highlight">
            <div className="section-header">
              <TrendingUpIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Smart Optimizer</h2>
              <span className="section-badge">Rule-based</span>
            </div>
            <p className="section-desc">
              Tell us your goal — the optimizer analyzes weather signals and finds your best window.
            </p>
            <OptimizationPanel hourly={todayHourly} daily={daily} region={selectedRegion} />
          </div>

          {/* Activity Planner */}
          <div className="section-card">
            <div className="section-header">
              <SunIcon size={18} color="#f59e0b" />
              <h2 className="section-title">Activity Planner</h2>
            </div>
            <p className="section-desc">Best day for your plans this week</p>
            <ActivityPlanner hourly={hourly} daily={daily} />
          </div>

          {/* Smart recommendations */}
          <div className="section-card">
            <div className="section-header">
              <AlertCircleIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Conditions & Alerts</h2>
            </div>
            <p className="section-desc">Rain, wind and preparedness guidance</p>
            <SmartRecommendations hourly={todayHourly} region={selectedRegion} />
          </div>

          {/* Transport Demand Estimate */}
          <div className="section-card section-card-highlight">
            <div className="section-header">
              <TrendingUpIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Transport Demand Estimate</h2>
              <span className="section-badge">Provider data</span>
            </div>
            <p className="section-desc">Heuristic weather and calendar demand indicators. No live fare, traffic or driver availability data.</p>
            <ErrorBoundary>
              <Suspense fallback={<p className="lazy-loading">Loading surge predictions...</p>}>
                <TransportSurgePredictor
                  region={selectedRegion}
                  hourly={hourly}
                  daily={daily}
                  cityCoords={cityCoords}
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Best time to go */}
          <div className="section-card">
            <div className="section-header">
              <SunIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Best Time to Go</h2>
            </div>
            <p className="section-desc">Three-hour windows for the selected date; consult current forecasts before leaving</p>
            <BestTimeToGo hourly={todayHourly} />
          </div>

          {/* Day selector */}
          <div className="section-card">
            <div className="section-header">
              <CalendarIcon size={18} color="var(--accent)" />
              <h2 className="section-title">7-Day Forecast</h2>
            </div>
            <p className="section-desc">Tap a day to see hourly breakdown</p>
            <DayCards
              daily={daily}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Hourly timeline */}
          <div className="section-card">
            <div className="section-header">
              <ClockIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Hour by Hour</h2>
            </div>
            <p className="section-desc">{dateLabel} - scroll to see when rain hits</p>
            <HourlyTimeline hourly={todayHourly} />
          </div>

          {/* Historical Comparison */}
          <div className="section-card">
            <div className="section-header">
              <TrendingUpIcon size={18} color="var(--accent)" />
              <h2 className="section-title">vs. Last Year</h2>
            </div>
            <p className="section-desc">How this week compares to the same period last year</p>
            <ErrorBoundary>
              <Suspense fallback={<p className="lazy-loading">Loading historical data...</p>}>
                <HistoricalComparison daily={daily} region={selectedRegion} coords={cityCoords ?? regionCoords} />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Weather Risk Map — Live Radar */}
          <div className="section-card">
            <div className="section-header">
              <DropletIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Weather Risk Map</h2>
              <span className="section-badge">Provider data</span>
            </div>
            <p className="section-desc">Live rain radar over the Philippines — powered by RainViewer</p>
            <ErrorBoundary>
              <WeatherRiskMap />
            </ErrorBoundary>
          </div>

          {/* Weekly trend chart */}
          <div className="section-card">
            <div className="section-header">
              <TrendingUpIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Weekly Rain Trend</h2>
            </div>
            <p className="section-desc">{getRegionLabel(selectedRegion)}</p>
            <ErrorBoundary>
              <Suspense fallback={<p className="lazy-loading">Loading chart...</p>}>
                <RainChart daily={daily} />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Emergency Hotlines — direct numbers near your region */}
          <div className="section-card">
            <div className="section-header">
              <AlertCircleIcon size={18} color="#c62828" />
              <h2 className="section-title">Emergency Hotlines</h2>
            </div>
            <p className="section-desc">Direct disaster & rescue numbers near {getRegionLabel(selectedRegion)}</p>
            <EmergencyHotlines region={selectedRegion} />
          </div>

          {/* Evacuation Centers — OSM nearby shelters */}
          <div className="section-card">
            <ErrorBoundary>
              <EvacuationPanel
                lat={cityCoords?.lat ?? regionCoords.lat}
                lon={cityCoords?.lon ?? regionCoords.lon}
                region={selectedCity || getRegionLabel(selectedRegion)}
              />
            </ErrorBoundary>
          </div>
        </section>
      </div>

      {/* Kuya Weather Chatbot */}
      <Suspense fallback={null}>
        <WeatherChatbot selectedRegion={selectedRegion} />
      </Suspense>
    </div>
  );
}
