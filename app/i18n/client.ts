'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const initialized = i18n.isInitialized;

if (!initialized) {
  i18n
    .use(HttpBackend) // <--- ADD THIS
    .use(initReactI18next)
    .init({
      fallbackLng: 'et',
      supportedLngs: ['et', 'en', 'fr'],
      defaultNS: 'common',
      ns: ['common'],
      interpolation: { escapeValue: false },
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json' // ✅ This matches your public folder
      }
    });
}

export default i18n;
