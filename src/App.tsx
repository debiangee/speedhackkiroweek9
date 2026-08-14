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
      <main className="app-main" id="main-content" role="main">
        <Dashboard />
      </main>
      <footer className="app-footer">
        <div className="footer-credits">
          <span>Team Weather Lang &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
