import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en";
import mi from "./locales/mi";
import sm from "./locales/sm";
import to from "./locales/to";
import zh from "./locales/zh";
import hi from "./locales/hi";
import si from "./locales/si";

export const SUPPORTED_LANGUAGES = [
  { code: "mi", name: "Te reo Māori", flag: "🌿", nativeName: "Te reo Māori" },
  { code: "en", name: "English", flag: "🇳🇿", nativeName: "English" },
  { code: "sm", name: "Samoan", flag: "🇼🇸", nativeName: "Gagana Sāmoa" },
  { code: "to", name: "Tongan", flag: "🇹🇴", nativeName: "Lea faka-Tonga" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳", nativeName: "普通话" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "si", name: "Sinhala", flag: "🇱🇰", nativeName: "සිංහල" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      mi: { translation: mi },
      sm: { translation: sm },
      to: { translation: to },
      zh: { translation: zh },
      hi: { translation: hi },
      si: { translation: si },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "mi", "sm", "to", "zh", "hi", "si"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "fxd-language",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
