import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container page">
      <div className="empty">
        <div className="empty-art"><span className="empty-ring" /><Compass size={38} /></div>
        <h3>404 · {t('notFound.title')}</h3>
        <p className="muted">{t('notFound.text')}</p>
        <Link to="/" className="btn btn-primary">{t('notFound.home')}</Link>
      </div>
    </div>
  );
}
