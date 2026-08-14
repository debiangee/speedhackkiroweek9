import { useState, useCallback } from 'react';
import { type Locale, getStoredLocale, setStoredLocale } from '../utils/i18n';

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(getStoredLocale);

  const toggle = useCallback(() => {
    setLocale((prev) => {
      const next = prev === 'en' ? 'fil' : 'en';
      setStoredLocale(next);
      return next;
    });
  }, []);

  return { locale, toggle };
}
