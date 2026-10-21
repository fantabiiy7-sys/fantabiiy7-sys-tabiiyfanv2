import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations, LANGS } from '../i18n/translations';

const I18nContext = createContext(null);

function readPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function initialLang() {
  try {
    const saved = localStorage.getItem('tf-lang');
    if (LANGS.includes(saved)) return saved;
  } catch {}
  return 'uz';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((l) => {
    if (!LANGS.includes(l)) return;
    setLangState(l);
    try {
      localStorage.setItem('tf-lang', l);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  /** t('nav.home'), t('gradeN', { n: 5 }) */
  const t = useCallback(
    (key, vars) => {
      let val = readPath(translations[lang], key);
      if (val === undefined) val = readPath(translations.uz, key);
      if (val === undefined) return key;
      if (typeof val === 'string' && vars) {
        return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
      }
      return val;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
