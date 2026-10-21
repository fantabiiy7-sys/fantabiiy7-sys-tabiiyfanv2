import { Send, MessageCircle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useSetting } from '../context/SettingsContext';
import { telegramHref } from '../lib/utils';

/** Admin sozlamalaridagi Telegram havolasi (bo'lmasa — bo'sh qator) */
export function useTelegramLink() {
  const setting = useSetting();
  return telegramHref(setting('telegramUrl'));
}

/** Har bir ommaviy sahifada pastki chap burchakdagi suzuvchi tugma */
export function FeedbackFab() {
  const { t } = useI18n();
  const href = useTelegramLink();
  if (!href) return null;
  return (
    <a className="feedback-fab" href={href} target="_blank" rel="noreferrer" title={t('feedback.title')}>
      <Send size={20} />
      <span>{t('feedback.title')}</span>
    </a>
  );
}

/** "Platforma haqida" sahifasidagi karta */
export function FeedbackCard() {
  const { t } = useI18n();
  const href = useTelegramLink();
  if (!href) return null;
  return (
    <div className="card feedback-card">
      <span className="page-icon tone-blue">
        <MessageCircle size={24} />
      </span>
      <div>
        <h2 className="sub-title" style={{ margin: '0 0 4px' }}>
          {t('feedback.title')}
        </h2>
        <p className="muted">{t('feedback.text')}</p>
        <a className="btn btn-primary" href={href} target="_blank" rel="noreferrer">
          <Send size={18} /> {t('feedback.button')}
        </a>
      </div>
    </div>
  );
}
