import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE } from './config';
import { detectLocale } from './locale';
import uz from '../locales/uz/translation.json';

i18n.use(initReactI18next).init({
  resources: { uz: { translation: uz } },
  lng: detectLocale().locale,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

export default i18n;
