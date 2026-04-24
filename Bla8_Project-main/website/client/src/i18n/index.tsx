import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Static imports — NO lazy loading, all bundled at build time ─────────────
import ar from './translations/ar.json';
import en from './translations/en.json';
import fr from './translations/fr.json';
import de from './translations/de.json';
import es from './translations/es.json';
import ur from './translations/ur.json';

import { LangCode, LANGUAGES, RTL_LANGS } from './languages';
export * from './languages';


interface TranslationDict {
  [key: string]: string | TranslationDict;
}

interface LanguageContextType {
  lang: LangCode;
  dir: 'rtl' | 'ltr';
  setLanguage: (code: LangCode) => void;
  t: (key: string) => string;
}

// ─── Translation map — all loaded at startup ──────────────────────────────────
const translations: Record<LangCode, TranslationDict> = {
  SA: ar as unknown as TranslationDict,
  US: en as unknown as TranslationDict,
  FR: fr as unknown as TranslationDict,
  DE: de as unknown as TranslationDict,
  ES: es as unknown as TranslationDict,
  PK: ur as unknown as TranslationDict,
};



// ─── Helper: resolve dot-notation key ────────────────────────────────────────
function resolve(dict: TranslationDict, key: string): string {
  const parts = key.split('.');
  let current: string | TranslationDict = dict;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return key;
    current = (current as TranslationDict)[part];
  }
  if (typeof current === 'string') return current;
  return key;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const LanguageContext = createContext<LanguageContextType>({
  lang: 'SA',
  dir: 'rtl',
  setLanguage: () => {},
  t: (k) => {
    const fallback = resolve(ar as unknown as TranslationDict, k);
    return fallback !== k ? fallback : k;
  },
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<LangCode>(() => {
    return (localStorage.getItem('appLanguage') as LangCode) || 'SA';
  });

  const dir: 'rtl' | 'ltr' = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';



  const setLanguage = useCallback((code: LangCode) => {
    localStorage.setItem('appLanguage', code);
    setLang(code);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const dict = translations[lang];
      const result = resolve(dict, key);
      // Fallback to Arabic if key not found in current language
      if (result === key) {
        const fallback = resolve(translations['SA'], key);
        return fallback !== key ? fallback : key;
      }
      return result;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, dir, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useLanguage = (): LanguageContextType => useContext(LanguageContext);


