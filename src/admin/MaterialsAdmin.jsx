import { Navigate, useParams } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { MATERIAL_TYPES } from '../lib/constants';
import AdminList from './AdminList';

export default function MaterialsAdmin() {
  const { type } = useParams();
  const { t } = useI18n();
  const def = MATERIAL_TYPES[type];
  if (!def) return <Navigate to="/admin" replace />;
  return (
    <AdminList
      key={type}
      table="materials"
      type={type}
      icon={def.icon}
      color={def.color}
      title={t(`nav.${type}`)}
      basePath={`/admin/materials/${type}`}
      publicPath={(id) => `/material/${id}`}
    />
  );
}
