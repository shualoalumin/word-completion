import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en/common.json';
import koTranslations from './locales/ko/common.json';

i18n
  .use(LanguageDetector) // 브라우저 언어 자동 감지
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ko: {
        translation: koTranslations,
      },
    },
    fallbackLng: 'en', // 기본 언어
    debug: false,
    interpolation: {
      escapeValue: false, // React는 이미 XSS 방지
    },
    detection: {
      // 언어 감지 옵션
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
