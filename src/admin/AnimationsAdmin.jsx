import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import AdminList from './AdminList';

export default function AnimationsAdmin() {
  const { t } = useI18n();
  const [tab, setTab] = useState('items');
  return (
    <>
      <AdminList
        key={tab}
        table="animations"
        icon={Sparkles}
        color="teal"
        title={tab === 'templates' ? `${t('nav.animation')} · ${t('admin.templates')}` : t('nav.animation')}
        basePath="/admin/animations"
        publicPath={tab === 'templates' ? null : (id) => `/animations/${id}`}
        extraFilters={tab === 'templates' ? { onlyTemplates: true } : {}}
        headerExtra={
          <div className="segmented">
            <button className={tab === 'items' ? 'active' : ''} onClick={() => setTab('items')}>
              {t('nav.animation')}
            </button>
            <button className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>
              {t('admin.templates')}
            </button>
          </div>
        }
      />
    </>
  );
}
