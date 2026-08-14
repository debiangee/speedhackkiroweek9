// Simple i18n with Filipino (Tagalog) and English

export type Locale = 'en' | 'fil';

const translations: Record<string, Record<Locale, string>> = {
  'app.title': { en: 'Weather Lang', fil: 'Weather Lang' },
  'app.subtitle': { en: 'Your PH Weather Companion', fil: 'Kasama Mo sa Panahon' },
  'app.tagline': { en: 'Real-time forecasts, made simple', fil: 'Live forecast, simple lang' },
  'dashboard.loading': { en: 'Fetching live weather data...', fil: 'Kinukuha ang live na datos ng panahon...' },
  'dashboard.loadingSub': { en: 'Getting forecast from Open-Meteo', fil: 'Kumukuha ng forecast mula sa Open-Meteo' },
  'dashboard.error': { en: 'Could not load weather data', fil: 'Hindi makuha ang datos ng panahon' },
  'dashboard.retry': { en: 'Try Again', fil: 'Subukan Muli' },
  'section.conditions': { en: 'Conditions & Alerts', fil: 'Kalagayan at Babala' },
  'section.bestTime': { en: 'Best Time to Go', fil: 'Pinakamainam na Oras' },
  'section.bestTimeDesc': { en: 'Driest and rainiest 3-hour windows today', fil: 'Pinakatuyo at pinaka-maulan na 3-oras ngayon' },
  'section.7day': { en: '7-Day Forecast', fil: '7-Araw na Forecast' },
  'section.7dayDesc': { en: 'Tap a day to see hourly breakdown', fil: 'Pindutin ang araw para makita ang bawat oras' },
  'section.hourly': { en: 'Hour by Hour', fil: 'Bawat Oras' },
  'section.weeklyTrend': { en: 'Weekly Rain Trend', fil: 'Lingguhang Takbo ng Ulan' },
  'section.weekSummary': { en: 'Week at a Glance', fil: 'Buong Linggo sa Isang Tingin' },
  'section.weekSummaryDesc': { en: 'Rain outlook for the next 7 days', fil: 'Outlook ng ulan sa susunod na 7 araw' },
  'section.activityPlanner': { en: 'Activity Planner', fil: 'Plano ng Aktibidad' },
  'section.activityPlannerDesc': { en: 'Best day for your plans this week', fil: 'Pinakamainam na araw para sa plano mo' },
  'section.historical': { en: 'vs. Last Year', fil: 'Kumpara sa Nakaraang Taon' },
  'section.historicalDesc': { en: 'How this week compares to the same period last year', fil: 'Kumpara ng linggong ito sa parehong panahon noong nakaraang taon' },
  'actions.save': { en: 'Save', fil: 'I-save' },
  'actions.saved': { en: 'Saved', fil: 'Na-save' },
  'actions.compare': { en: 'Compare', fil: 'Ihambing' },
  'actions.share': { en: 'Share', fil: 'Ibahagi' },
  'typhoon.title': { en: 'Typhoon Season Active', fil: 'Aktibo ang Panahon ng Bagyo' },
  'typhoon.message': {
    en: 'July-October is peak typhoon season in the Philippines. Monitor PAGASA advisories and prepare emergency kits.',
    fil: 'Hulyo-Oktubre ang kasagsagan ng bagyo sa Pilipinas. Subaybayan ang advisory ng PAGASA at maghanda ng emergency kit.'
  },
  'footer.disclaimer': { en: 'Live weather data from', fil: 'Live na datos ng panahon mula sa' },
  'footer.advisory': { en: 'For official storm advisories, check', fil: 'Para sa opisyal na babala ng bagyo, tingnan ang' },
};

export function t(key: string, locale: Locale): string {
  return translations[key]?.[locale] || translations[key]?.['en'] || key;
}

export function getStoredLocale(): Locale {
  const stored = localStorage.getItem('ulanba-locale');
  if (stored === 'fil' || stored === 'en') return stored;
  return 'en';
}

export function setStoredLocale(locale: Locale): void {
  localStorage.setItem('ulanba-locale', locale);
}
