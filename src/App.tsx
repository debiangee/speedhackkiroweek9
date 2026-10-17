import './App.css';
import { useDarkMode } from './hooks/useDarkMode';
import { useLocale } from './hooks/useLocale';
import { Dashboard } from './components/Dashboard';
import { DarkModeToggle } from './components/DarkModeToggle';
import { LanguageToggle } from './components/LanguageToggle';
import { CloudRainIcon } from './components/Icons';
import { t } from './utils/i18n';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const { isDark, toggle } = useDarkMode();
  const { locale, toggle: toggleLocale } = useLocale();

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to forecast</a>
      <header className="app-header" role="banner">
        <div className="header-brand">
          <CloudRainIcon size={28} color="white" />
          <div>
            <h1>{t('app.title', locale)}</h1>
            <p>{t('app.subtitle', locale)}</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="header-tagline">{t('app.tagline', locale)}</span>
          <LanguageToggle locale={locale} onToggle={toggleLocale} />
          <DarkModeToggle isDark={isDark} onToggle={toggle} />
        </div>
      </header>
      <nav className="section-navigation" aria-label={locale === 'fil' ? 'Pangunahing nabigasyon' : 'Primary navigation'}>
        {[
          ['overview', 'Overview', 'Pangkalahatan'], ['forecast', 'Forecast', 'Taya ng panahon'],
          ['trip-planner', 'Trip Planner', 'Plano sa biyahe'], ['weather-maps', 'Weather Maps', 'Mga mapa'],
          ['preparedness', 'Official Sources', 'Opisyal na sanggunian'], ['kuya-weather', 'Kuya Weather', 'Kuya Weather'],
        ].map(([id, en, fil]) => <a key={id} href={`#${id}`}>{locale === 'fil' ? fil : en}</a>)}
      </nav>
      <main className="app-main" id="main-content" role="main">
        <Dashboard />
      </main>
      <footer className="app-footer">
        <div className="footer-credits">
          <span>Team Weather Lang &copy; {new Date().getFullYear()}</span>
          <span className="footer-data-sources">
            Data from <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
            {' | '}
            Official information: <a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noopener noreferrer">PAGASA</a>
          </span>
        </div>
      </footer>
      <section className="privacy-note" aria-label={locale === 'fil' ? 'Pagkapribado at mga limitasyon' : 'Privacy and limitations'}>
        <details><summary>{locale === 'fil' ? 'Pagkapribado, datos at mga limitasyon' : 'Privacy, data and limitations'}</summary>
          <p>{locale === 'fil' ? 'Opsyonal ang lokasyon: itinutugma ang GPS sa pinakamalapit na nakatalang lungsod sa iyong device. Lokal na sine-save ang mga kagustuhan. Ipinapadala sa mga provider ang napiling forecast point, hindi ang tanong mo sa assistant.' : 'Location is optional: GPS is matched to a catalog city on your device. Preferences and recent forecasts are stored locally. Providers receive the selected forecast coordinates; assistant questions are processed on your device.'}</p>
          <p>Open-Meteo supplies forecasts. Maps and imagery contact RainViewer, Google Maps, Esri, CARTO, OpenStreetMap and Overpass only when requested. Vercel Analytics measures usage. Third-party services receive ordinary network metadata under their own policies. No accounts or background notification delivery.</p>
          <p>Offline navigation is not supported. Already loaded forecasts expire after 30 minutes. All planning scores are heuristics; consult PAGASA and local authorities for official warnings and operational information.</p>
        </details>
      </section>
      <Analytics />
    </div>
  );
}

export default App;
