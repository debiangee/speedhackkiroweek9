import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type Locale, getStoredLocale, setStoredLocale } from '../utils/i18n';
const LocaleContext = createContext<{locale: Locale; toggle: () => void}>({locale: 'en', toggle: () => {}});
export function LocaleProvider({children}: {children: ReactNode}) {
  const [locale, setLocale] = useState<Locale>(getStoredLocale);
  const toggle = useCallback(() => setLocale(previous => { const next = previous === 'en' ? 'fil' : 'en'; setStoredLocale(next); document.documentElement.lang = next === 'fil' ? 'fil' : 'en'; return next; }), []);
  return <LocaleContext.Provider value={{locale, toggle}}>{children}</LocaleContext.Provider>;
}
export function useLocale() { return useContext(LocaleContext); }
