import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MonitorPlay, Upload, Link2, Trash2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { useTopics } from '../lib/hooks';
import { deleteItem, getItem, saveItem } from '../lib/api';
import { removeFiles } from '../lib/storage';
import { MATERIAL_TYPES } from '../lib/constants';
import { youtubeId } from '../lib/utils';
import { Spinner, EmptyState } from '../components/States';
import { Field, FileField, GradeTopicFields, SaveBar, StatusBadge, TranslationFields } from './FormParts';

const EMPTY = {
  title: '',
  description: '',
  translations: {},
  grade: null,
  topic_id: null,
  category: null,
  file_path: null,
  file_name: null,
  file_size: null,
  file_mime: null,
  external_url: '',
  cover_path: null,
  status: 'draft',
};

export default function MaterialForm() {
  const { type, id } = useParams();
  const isNew = !id || id === 'new';
  const def = MATERIAL_TYPES[type];
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const { topics } = useTopics();
  const [form, setForm] = useState({ ...EMPTY, type });
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [source, setSource] = useState('youtube'); // video uchun: youtube | upload | url

  useEffect(() => {
    if (isNew) return;
    getItem('materials', id)
      .then((row) => {
        if (!row) return setNotFound(true);
        setForm({ ...EMPTY, ...row, external_url: row.external_url || '' });
        setOriginal(row);
        if (row.type === 'video') setSource(row.file_path ? 'upload' : youtubeId(row.external_url) ? 'youtube' : 'url');
        else if (!row.file_path && row.external_url) setSource('url');
      })
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, isNew, toast]);

  if (!def) return <Navigate to="/admin" replace />;
  if (loading) return <Spinner />;
  if (notFound) return <EmptyState title={t('admin.notFound')} text=" " />;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isVideo = type === 'video';
  const useUrl = (isVideo && source !== 'upload') || (!isVideo && source === 'url');

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = t('admin.titleRequired');
    if (!form.grade) e.grade = t('admin.gradeRequired');
    if (isVideo && source === 'youtube' && !youtubeId(form.external_url)) e.url = t('admin.invalidYoutube');
    if (useUrl && !form.external_url.trim()) e.url = e.url || t('admin.fileOrUrlRequired');
    if (!useUrl && !form.file_path) e.file = t('admin.fileOrUrlRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save(status) {
    if (!validate()) return;
    setSaving(status);
    try {
      const payload = {
        ...form,
        type,
        status,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        external_url: useUrl ? form.external_url.trim() : null,
        ...(useUrl ? { file_path: null, file_name: null, file_size: null, file_mime: null } : {}),
      };
      const saved = await saveItem('materials', payload);
      // almashtirilgan eski fayllarni Storage'dan o'chirish
      if (original) {
        const stale = [];
        if (original.file_path && original.file_path !== saved.file_path) stale.push(original.file_path);
        if (original.cover_path && original.cover_path !== saved.cover_path) stale.push(original.cover_path);
        removeFiles(stale).catch(() => {});
      }
      toast(t('admin.saved'));
      navigate(`/admin/materials/${type}`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(null);
    }
  }

  async function remove() {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteItem('materials', original);
      toast(t('admin.deleted'));
      navigate(`/admin/materials/${type}`);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const sources = isVideo
    ? [
        { key: 'youtube', icon: MonitorPlay, label: t('admin.sourceYoutube') },
        { key: 'upload', icon: Upload, label: t('admin.sourceUpload') },
        { key: 'url', icon: Link2, label: t('admin.sourceUrl') },
      ]
    : [
        { key: 'upload', icon: Upload, label: t('admin.sourceUpload') },
        { key: 'url', icon: Link2, label: t('admin.sourceUrl') },
      ];
  const activeSource = isVideo ? source : source === 'url' ? 'url' : 'upload';

  return (
    <div className="form-page">
      <Link to={`/admin/materials/${type}`} className="back-link">
        <ArrowLeft size={16} /> {t(`nav.${type}`)}
      </Link>
      <div className="admin-head">
        <div className="page-header-main">
          <span className={`page-icon tone-${def.color}`}>
            <def.icon size={24} />
          </span>
          <h1>{isNew ? t('admin.addNew') : t('admin.edit')}</h1>
          {!isNew && <StatusBadge status={form.status} />}
        </div>
      </div>

      <div className="card form-card">
        <Field label={t('admin.title')} required error={errors.title}>
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={300} autoFocus={isNew} />
        </Field>
        <GradeTopicFields value={form} onChange={set} topics={topics} errors={errors} />
        {def.categories.length > 0 && (
          <Field label={t('category')}>
            <select value={form.category || ''} onChange={(e) => set({ category: e.target.value || null })}>
              <option value="">—</option>
              {def.categories.map((c) => (
                <option key={c} value={c}>
                  {t(`categories.${c}`)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t('admin.descriptionField')}>
          <textarea rows={4} value={form.description || ''} onChange={(e) => set({ description: e.target.value })} />
        </Field>

        <div className="field">
          <span className="field-label">{isVideo ? t('admin.videoSource') : t('admin.file')}</span>
          <div className="segmented">
            {sources.map((s) => (
              <button
                key={s.key}
                type="button"
                className={activeSource === s.key ? 'active' : ''}
                onClick={() => setSource(s.key)}
              >
                <s.icon size={16} /> {s.label}
              </button>
            ))}
          </div>
        </div>

        {useUrl ? (
          <Field
            label={isVideo && source === 'youtube' ? t('admin.youtubeUrl') : t('admin.externalUrl')}
            required
            error={errors.url}
          >
            <input
              type="url"
              placeholder={isVideo && source === 'youtube' ? 'https://www.youtube.com/watch?v=…' : 'https://…'}
              value={form.external_url}
              onChange={(e) => set({ external_url: e.target.value })}
            />
          </Field>
        ) : (
          <>
            <FileField
              label={t('admin.file')}
              accept={def.accept}
              folder={type}
              current={form.file_path ? { path: form.file_path, name: form.file_name, size: form.file_size } : null}
              onUploaded={(f) => set({ file_path: f.path, file_name: f.name, file_size: f.size, file_mime: f.mime })}
              onRemove={() => set({ file_path: null, file_name: null, file_size: null, file_mime: null })}
              onBusy={setUploading}
              hint={isVideo ? t('admin.largeFileNote') : undefined}
            />
            {errors.file && <span className="field-error small">{errors.file}</span>}
          </>
        )}

        <FileField
          label={t('admin.cover')}
          accept="image/*"
          folder="covers"
          image
          current={form.cover_path ? { path: form.cover_path } : null}
          onUploaded={(f) => set({ cover_path: f.path })}
          onRemove={() => set({ cover_path: null })}
          onBusy={setUploading}
        />

        <TranslationFields value={form.translations} onChange={(translations) => set({ translations })} />
      </div>

      <SaveBar
        saving={saving}
        disabled={uploading}
        status={original?.status}
        onSave={save}
        extra={
          !isNew && (
            <button type="button" className="btn btn-danger-ghost" onClick={remove}>
              <Trash2 size={16} /> {t('admin.delete')}
            </button>
          )
        }
      />
    </div>
  );
}
