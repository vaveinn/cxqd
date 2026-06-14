import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import en from './en';
import zh from './zh';

type Lang = 'en' | 'zh';

const translations: Record<Lang, Record<string, string>> = { en, zh };

interface I18nContextValue {
  t: (key: string, params?: Record<string, string>) => string;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key: string) => key,
  lang: 'en',
  setLang: () => {},
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('lang');
    return (stored === 'en' || stored === 'zh') ? stored : 'en';
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>) => {
    const map = translations[lang];
    let value = map[key] ?? translations['en'][key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{{${k}}}`, v);
      });
    }
    return value;
  }, [lang]);

  const value = useMemo(() => ({ t, lang, setLang }), [t, lang, setLang]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};
