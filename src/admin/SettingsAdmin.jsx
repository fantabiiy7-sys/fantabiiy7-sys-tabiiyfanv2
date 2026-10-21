import { useEffect, useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { getSettings, saveSettings } from '../lib/api';
import { LANGS } from '../i18n/translations';
import { Spinner } from '../components/States';
import { Field } from './FormParts';

// Ko'p tilli maydonlar: { uz, ru, en }
const LOCALIZED = [
  { key: 'siteName', multiline: false },
  { key: 'heroTitle', multiline: false },
  { key: 'heroText', multiline: true },
  { key: 'aboutText', multiline: true, rows: 6 },
  { key: 'footerText', multiline: false },
  { key: 'schoolName', multiline: false },
];
const PLAIN = [
  { key: 'contactEmail', type: 'email' },
  { key: 'contactPhone', type: 'tel' },
];

export default function SettingsAdmin() {
  const { t } = useI18n();
  const toast = useToast();
  const { reload } = useSettings();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('uz');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((d) => setData(d || {}))
      .catch((e) => {
        toast(e.message, 'error');
        setData({});
      });
  }, [toast]);

  if (!data) return <Spinner />;

  const setLocalized = (key, v) => setData((d) => ({ ...d, [key]: { ...(typeof d[key] === 'object' ? d[key] : {}), [tab]: v } }));
  const getLocalized = (key) => (typeof data[key] === 'object' && data[key] ? data[key][tab] || '' : '');

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings(data);
      await reload();
      toast(t('admin.saved'));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="form-page">
      <div className="admin-head">
        <div className="page-header-main">
          <span className="page-icon tone-blue">
            <Settings size={24} />
          </span>
          <h1>{t('admin.siteSettings')}</h1>
        </div>
      </div>
      <p className="muted small info-line">{t('admin.settingsHint')}</p>

      <div className="card form-card">
        <div className="segmented">
          {LANGS.map((l) => (
            <button key={l} type="button" className={tab === l ? 'active' : ''} onClick={() => setTab(l)}>
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>
        {LOCALIZED.map((f) => (
          <Field key={`${f.key}-${tab}`} label={t(`admin.${f.key}`)}>
            {f.multiline ? (
              <textarea rows={f.rows || 3} value={getLocalized(f.key)} onChange={(e) => setLocalized(f.key, e.target.value)} />
            ) : (
              <input value={getLocalized(f.key)} onChange={(e) => setLocalized(f.key, e.target.value)} />
            )}
          </Field>
        ))}
      </div>

      <div className="card form-card">
        <div className="form-grid two">
          {PLAIN.map((f) => (
            <Field key={f.key} label={t(`admin.${f.key}`)}>
              <input type={f.type} value={data[f.key] || ''} onChange={(e) => setData((d) => ({ ...d, [f.key]: e.target.value }))} />
            </Field>
          ))}
        </div>
      </div>

      <div className="save-bar">
        <span className="spacer" />
        <button className="btn btn-primary" disabled={saving}>
          <Save size={18} /> {saving ? t('admin.saving') : t('admin.save')}
        </button>
      </div>
    </form>
  );
}
