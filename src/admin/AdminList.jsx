import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, Search } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { useAsync, useDebounced, useTopics } from '../lib/hooks';
import { deleteItem, listItems, saveItem } from '../lib/api';
import { GRADES } from '../lib/constants';
import { formatDate, localized } from '../lib/utils';
import { EmptyState, ErrorBox, Spinner } from '../components/States';
import { StatusBadge } from './FormParts';

/**
 * Admin uchun umumiy ro'yxat: qidirish, sinf/holat filtri, nashr qilish, tahrirlash, o'chirish.
 */
export default function AdminList({ table, type, icon: Icon, color, title, basePath, publicPath, extraFilters = {}, headerExtra }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const { topics } = useTopics();
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const filters = { type, grade: grade || undefined, status: status || undefined, search: dq || undefined, ...extraFilters };
  const { data, loading, error, reload } = useAsync(() => listItems(table, filters), [JSON.stringify(filters)]);
  const [busyId, setBusyId] = useState(null);

  async function togglePublish(item) {
    setBusyId(item.id);
    try {
      await saveItem(table, { id: item.id, status: item.status === 'published' ? 'draft' : 'published' });
      toast(t('admin.saved'));
      reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item) {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    setBusyId(item.id);
    try {
      await deleteItem(table, item);
      toast(t('admin.deleted'));
      reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="admin-head">
        <div className="page-header-main">
          {Icon && (
            <span className={`page-icon tone-${color}`}>
              <Icon size={24} />
            </span>
          )}
          <h1>{title}</h1>
        </div>
        <div className="row-actions">
          {headerExtra}
          <Link to={`${basePath}/new`} className="btn btn-primary">
            <Plus size={18} /> {t('admin.addNew')}
          </Link>
        </div>
      </div>

      <div className="admin-filters">
        <label className="search-field">
          <Search size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlaceholder')} />
        </label>
        <select value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="">{t('allGrades')}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {t('gradeN', { n: g })}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('admin.status')}: —</option>
          <option value="published">{t('admin.published')}</option>
          <option value="draft">{t('admin.draft')}</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState
          icon={Icon}
          filtered={Boolean(grade || status || dq)}
          title={grade || status || dq ? undefined : t('admin.noItems')}
          text={grade || status || dq ? undefined : t('admin.noItemsText')}
          addTo={`${basePath}/new`}
        />
      ) : (
        <div className="card table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.title')}</th>
                <th className="hide-sm">{t('grade')}</th>
                <th className="hide-md">{t('topic')}</th>
                <th>{t('admin.status')}</th>
                <th className="hide-md">{t('admin.date')}</th>
                <th className="right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const topic = topics.find((x) => x.id === item.topic_id);
                return (
                  <tr key={item.id} className={busyId === item.id ? 'busy' : ''}>
                    <td>
                      <Link to={`${basePath}/${item.id}`} className="row-title">
                        {localized(item, 'title', lang)}
                      </Link>
                      {item.category && <small className="muted block">{t(`categories.${item.category}`)}</small>}
                    </td>
                    <td className="hide-sm nowrap">{item.grade ? t('gradeN', { n: item.grade }) : '—'}</td>
                    <td className="hide-md">{topic ? localized(topic, 'title', lang) : <span className="muted">—</span>}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="hide-md nowrap muted small">{formatDate(item.updated_at || item.created_at, lang)}</td>
                    <td className="right nowrap">
                      <button
                        className="icon-btn sm"
                        title={item.status === 'published' ? t('admin.unpublish') : t('admin.publish')}
                        onClick={() => togglePublish(item)}
                        disabled={busyId === item.id}
                      >
                        {item.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {publicPath && (
                        <Link className="icon-btn sm" title={t('admin.openPublic')} to={publicPath(item.id)} target="_blank">
                          <ExternalLink size={16} />
                        </Link>
                      )}
                      <Link className="icon-btn sm" title={t('admin.edit')} to={`${basePath}/${item.id}`}>
                        <Pencil size={16} />
                      </Link>
                      <button
                        className="icon-btn sm danger"
                        title={t('admin.delete')}
                        onClick={() => remove(item)}
                        disabled={busyId === item.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
