import { Link } from 'react-router-dom';
import { Inbox, AlertTriangle, Plus, PlugZap, Loader2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { isConfigured } from '../lib/supabase';

export function Spinner({ label }) {
  const { t } = useI18n();
  return (
    <div className="state-center">
      <Loader2 className="spin" size={28} />
      <span className="muted">{label || t('loading')}</span>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  const { t } = useI18n();
  return (
    <div className="error-box">
      <AlertTriangle size={22} />
      <div>
        <strong>{t('error')}</strong>
        {error?.message && <p className="muted small">{error.message}</p>}
      </div>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>
          {t('retry')}
        </button>
      )}
    </div>
  );
}

/**
 * Bo'sh holat. `addTo` berilsa — "Material qo'shish" tugmasi ko'rsatiladi
 * (admin bo'lmagan foydalanuvchi bossa, kirish sahifasiga yo'naltiriladi).
 */
export function EmptyState({ title, text, addTo, icon: Icon = Inbox, filtered }) {
  const { t } = useI18n();
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden="true">
        <span className="empty-ring" />
        <Icon size={38} />
      </div>
      <h3>{title || (filtered ? t('empty.filtered') : t('empty.title'))}</h3>
      <p className="muted">{text || (filtered ? t('empty.filteredText') : t('empty.text'))}</p>
      {addTo && !filtered && (
        <Link to={addTo} className="btn btn-primary">
          <Plus size={18} /> {t('empty.add')}
        </Link>
      )}
    </div>
  );
}

export function ConfigNotice() {
  const { t } = useI18n();
  if (isConfigured) return null;
  return (
    <div className="config-notice">
      <PlugZap size={20} />
      <div>
        <strong>{t('config.title')}</strong>
        <p className="small">{t('config.text')}</p>
      </div>
    </div>
  );
}
