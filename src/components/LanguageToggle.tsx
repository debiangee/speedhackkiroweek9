import { type Locale } from '../utils/i18n';
import './LanguageToggle.css';

interface LanguageToggleProps {
  locale: Locale;
  onToggle: () => void;
}

export function LanguageToggle({ locale, onToggle }: LanguageToggleProps) {
  return (
    <button
      className="lang-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${locale === 'en' ? 'Filipino' : 'English'}`}
      title={locale === 'en' ? 'Switch to Filipino' : 'Switch to English'}
    >
      <span className={`lang-option ${locale === 'en' ? 'active' : ''}`}>EN</span>
      <span className="lang-divider">/</span>
      <span className={`lang-option ${locale === 'fil' ? 'active' : ''}`}>FIL</span>
    </button>
  );
}
