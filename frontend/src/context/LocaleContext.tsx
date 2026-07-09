import { useMemo } from 'react';
import { Locale, DEFAULT_LOCALE } from '../i18n/config';
import { LocaleContext } from './locale-context';

interface LocaleProviderProps {
  children: React.ReactNode;
  locale: Locale;
  basename: string;
}

// `basename` router yaratilgandan keyin o'zgarmaydi — til almashtirish shuning
// uchun to'liq sahifa qayta yuklanishi (window.location.href) orqali amalga oshadi.
export function LocaleProvider({ children, locale, basename }: LocaleProviderProps): React.ReactElement {
  const value = useMemo(
    () => ({
      locale,
      basename,
      switchLocale: (next: Locale) => {
        const path = window.location.pathname.slice(basename.length) || '/';
        const prefix = next === DEFAULT_LOCALE ? '' : `/${next}`;
        window.location.href = `${prefix}${path}${window.location.search}`;
      },
    }),
    [locale, basename]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
