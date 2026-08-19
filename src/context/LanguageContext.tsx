import { createContext, useContext, useState, ReactNode } from 'react';
import { translations, Translations, LangCode } from '../i18n/translations';

interface LanguageContextType {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: Translations;
  /** Returns the "other" language translation for bilingual display */
  alt: Translations;
  /** The TTS language tag for expo-speech */
  speechLang: string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const SPEECH_LANG_MAP: Record<LangCode, string> = {
  en: 'en-AU',
  hi: 'hi-IN',
  pa: 'pa-IN',
  ta: 'ta-IN',
  zh: 'zh-CN',
  vi: 'vi-VN',
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>('hi'); // Default to Hindi for Amid

  const t = translations[lang] ?? translations.en;
  // "alt" is the secondary language — if primary is Hindi, show English as secondary and vice versa
  const alt = lang === 'en' ? translations.hi : translations.en;
  const speechLang = SPEECH_LANG_MAP[lang] ?? 'en-AU';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, alt, speechLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
