import { createContext } from 'react';
import { Locale } from '../i18n/config';

export interface LocaleContextValue {
  locale: Locale;
  basename: string;
  switchLocale: (next: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);
