import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import en from './locales/en.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lang: string) => void) => {
    // Support different react-native-localize APIs across versions
    // Prefer findBestLanguageTag if available, otherwise fall back to device locale.
    const available = Object.keys(resources);
    let languageTag = 'en';

    const anyLocalize: any = RNLocalize;
    if (typeof anyLocalize.findBestLanguageTag === 'function') {
      const best = anyLocalize.findBestLanguageTag(available);
      if (best?.languageTag) {
        languageTag = best.languageTag;
      }
    } else if (typeof RNLocalize.getLocales === 'function') {
      const locales = RNLocalize.getLocales();
      if (locales && locales.length > 0 && locales[0].languageTag) {
        languageTag = locales[0].languageTag;
      }
    }

    callback(languageTag);
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;


