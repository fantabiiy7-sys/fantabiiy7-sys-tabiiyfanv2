import { Link } from 'react-router-dom';
import { Plus, BookMarked, ArrowRight } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAsync } from '../lib/hooks';
import { countAll } from '../lib/api';
import { SECTIONS } from '../lib/constants';
import { ErrorBox } from '../components/States';

function adminPath(key) {
  if (key === 'animation') return '/admin/animations';
  if (key === 'test') return '/admin/tests';
  return `/admin/materials/${key}`;
}

export default function Dashboard() {
  const { t } = useI18n();
  const { data, error, reload, loading } = useAsync(() => countAll(), []);
  const c = data || {};

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>{t('admin.dashboard')}</h1>
          <p className="muted">{t('admin.welcome')}</p>
        </div>
      </div>
      {error && <ErrorBox error={error} onRetry={reload} />}
      <div className="grid dash-grid">
        {SECTIONS.map((s) => {
          const v = c[s.key] || { total: 0, draft: 0 };
          return (
            <div key={s.key} className="card dash-card">
              <div className="dash-top">
                <span className={`section-icon tone-${s.color}`}>
                  <s.icon size={22} />
                </span>
                <Link to={`${adminPath(s.key)}/new`} className="btn btn-soft btn-sm">
                  <Plus size={16} /> {t('admin.add')}
                </Link>
              </div>
              <h3>{t(`nav.${s.key}`)}</h3>
              <div className="dash-stats">
                <span>
                  <strong>{loading ? '…' : v.total}</strong>
                  <small className="muted">{t('admin.total')}</small>
                </span>
                <span>
                  <strong>{loading ? '…' : v.total - v.draft}</strong>
                  <small className="muted">{t('admin.published')}</small>
                </span>
                <span>
                  <strong>{loading ? '…' : v.draft}</strong>
                  <small className="muted">{t('admin.drafts')}</small>
                </span>
              </div>
              <Link to={adminPath(s.key)} className="dash-link small">
                {t('open')} <ArrowRight size={14} />
              </Link>
            </div>
          );
        })}
        <div className="card dash-card">
          <div className="dash-top">
            <span className="section-icon tone-blue">
              <BookMarked size={22} />
            </span>
          </div>
          <h3>{t('admin.topics')}</h3>
          <div className="dash-stats">
            <span>
              <strong>{loading ? '…' : c.topics || 0}</strong>
              <small className="muted">{t('admin.total')}</small>
            </span>
          </div>
          <Link to="/admin/topics" className="dash-link small">
            {t('admin.manageTopics')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
