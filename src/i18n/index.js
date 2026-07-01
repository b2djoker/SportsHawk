import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import bn from "./locales/bn.json";
import ml from "./locales/ml.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import kn from "./locales/kn.json";
import as_ from "./locales/as.json";
import or_ from "./locales/or.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      bn: { translation: bn },
      ml: { translation: ml },
      ta: { translation: ta },
      te: { translation: te },
      kn: { translation: kn },
      as: { translation: as_ },
      or: { translation: or_ }
    },
    fallbackLng: "en",
    lng: localStorage.getItem("sportshawk_language") || "en",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "sportshawk_language"
    }
  });

export default i18n;
