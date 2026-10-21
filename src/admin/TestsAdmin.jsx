import { ClipboardCheck } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import AdminList from './AdminList';

export default function TestsAdmin() {
  const { t } = useI18n();
  return (
    <AdminList
      table="tests"
      icon={ClipboardCheck}
      color="indigo"
      title={t('nav.test')}
      basePath="/admin/tests"
      publicPath={(id) => `/tests/${id}`}
    />
  );
}
