import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enDict from './locales/en.json';
import hiDict from './locales/hi.json';
import teDict from './locales/te.json';
import taDict from './locales/ta.json';

const resources = {
  en: { translation: enDict },
  hi: { translation: hiDict },
  te: { translation: teDict },
  ta: { translation: taDict }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('vitascan_lang') || 'en', // Get initial language from localStorage
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
