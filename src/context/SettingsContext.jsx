import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSettings } from '../lib/api';
import { useI18n } from './I18nContext';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});

  const reload = useCallback(async () => {
    try {
      setSettings(await getSettings());
    } catch {
      setSettings({});
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <SettingsContext.Provider value={{ settings, reload }}>{children}</SettingsContext.Provider>;
}

/** Sozlama qiymatini joriy tilda qaytaradi; bo'sh bo'lsa — fallback */
export function useSetting() {
  const { settings } = useContext(SettingsContext);
  const { lang } = useI18n();
  return useCallback(
    (key, fallback = '') => {
      const v = settings?.[key];
      if (v && typeof v === 'object') {
        return (v[lang] && v[lang].trim()) || (v.uz && v.uz.trim()) || fallback;
      }
      return (typeof v === 'string' && v.trim()) || fallback;
    },
    [settings, lang]
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
