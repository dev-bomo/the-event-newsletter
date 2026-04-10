import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslations from "./locales/en.json";
import roTranslations from "./locales/ro.json";

const isBrowser = typeof window !== "undefined";

if (isBrowser) {
  i18n.use(LanguageDetector);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ro: {
        translation: roTranslations,
      },
    },
    fallbackLng: "en",
    lng: isBrowser ? undefined : "en",
    supportedLngs: ["en", "ro"],
    detection: isBrowser
      ? {
          order: ["localStorage", "navigator"],
          caches: ["localStorage"],
          lookupLocalStorage: "i18nextLng",
        }
      : undefined,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
