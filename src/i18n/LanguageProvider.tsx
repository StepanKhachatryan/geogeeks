'use client';

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { getLang, getServerLang, subscribe, toggleLang } from './langStore';
import { messages, type Lang, type MessageKey } from './messages';

type LanguageValue = {
  lang: Lang;
  en: boolean;
  /** Translate a static UI string. */
  t: (key: MessageKey) => string;
  /** Pick between the Armenian and English variant of a data field. */
  pick: (hy: string, en: string) => string;
  toggle: () => void;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getLang, getServerLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      en: lang === 'en',
      t: (key) => messages[lang][key],
      pick: (hy, en) => (lang === 'en' ? en : hy),
      toggle: toggleLang,
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
