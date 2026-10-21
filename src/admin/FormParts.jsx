import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileCheck2, X, Image as ImageIcon, Loader2, Settings2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { GRADES } from '../lib/constants';
import { formatSize, localized, publicUrl } from '../lib/utils';
import { uploadFile } from '../lib/storage';

export function Field({ label, children, hint, error, required }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">
        {label}
        {required && <span className="req"> *</span>}
      </span>
      {children}
      {hint && <span className="field-hint muted small">{hint}</span>}
      {error && <span className="field-error small">{error}</span>}
    </label>
  );
}

/** Sinf va mavzu tanlash. Mavzular sinf bo'yicha filtrlanadi. */
export function GradeTopicFields({ value, onChange, topics, errors = {}, gradeOptional }) {
  const { t, lang } = useI18n();
  const list = topics.filter((x) => !value.grade || x.grade === Number(value.grade));
  return (
    <div className="form-grid two">
      <Field label={t('grade')} required={!gradeOptional} error={errors.grade}>
        <select
          value={value.grade || ''}
          onChange={(e) => onChange({ grade: e.target.value ? Number(e.target.value) : null, topic_id: null })}
        >
          <option value="">—</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {t('gradeN', { n: g })}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label={t('topic')}
        hint={
          <Link to="/admin/topics" className="link-inline">
            <Settings2 size={12} /> {t('admin.manageTopics')}
          </Link>
        }
      >
        <select value={value.topic_id || ''} onChange={(e) => onChange({ topic_id: e.target.value || null })} disabled={!value.grade}>
          <option value="">{value.grade ? t('admin.selectTopic') : '—'}</option>
          {list.map((x) => (
            <option key={x.id} value={x.id}>
              {localized(x, 'title', lang)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

/** Ruscha va inglizcha tarjimalar */
export function TranslationFields({ value = {}, onChange, withDescription = true }) {
  const { t } = useI18n();
  const set = (lng, field, v) => onChange({ ...value, [lng]: { ...(value[lng] || {}), [field]: v } });
  const hasAny = ['ru', 'en'].some((l) => value[l]?.title || value[l]?.description);
  return (
    <details className="translations" open={hasAny}>
      <summary>{t('admin.translations')}</summary>
      <p className="muted small">{t('admin.translationsHint')}</p>
      <div className="form-grid two">
        <Field label={t('admin.titleRu')}>
          <input value={value.ru?.title || ''} onChange={(e) => set('ru', 'title', e.target.value)} />
        </Field>
        <Field label={t('admin.titleEn')}>
          <input value={value.en?.title || ''} onChange={(e) => set('en', 'title', e.target.value)} />
        </Field>
        {withDescription && (
          <>
            <Field label={t('admin.descRu')}>
              <textarea rows={3} value={value.ru?.description || ''} onChange={(e) => set('ru', 'description', e.target.value)} />
            </Field>
            <Field label={t('admin.descEn')}>
              <textarea rows={3} value={value.en?.description || ''} onChange={(e) => set('en', 'description', e.target.value)} />
            </Field>
          </>
        )}
      </div>
    </details>
  );
}

/**
 * Fayl tanlash + yuklash. Fayl tanlanganda darhol Storage'ga yuklanadi
 * va onUploaded({path,name,size,mime}) chaqiriladi.
 */
export function FileField({ label, accept, current, onUploaded, onRemove, folder, image, hint, onBusy }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  async function handle(file) {
    if (!file) return;
    setError('');
    setProgress(0);
    onBusy?.(true);
    try {
      const res = await uploadFile(file, folder, setProgress);
      onUploaded(res);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setProgress(null);
      onBusy?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const busy = progress !== null;
  const Icon = image ? ImageIcon : Upload;

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {current?.path && !busy ? (
        <div className="file-current">
          {image ? (
            <img src={publicUrl(current.path)} alt="" className="file-thumb" />
          ) : (
            <FileCheck2 size={22} className="text-green" />
          )}
          <div className="file-info">
            <strong className="truncate">{current.name || current.path.split('/').pop()}</strong>
            {current.size ? <small className="muted">{formatSize(current.size)}</small> : null}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
            {t('admin.replaceFile')}
          </button>
          <button type="button" className="icon-btn sm danger" onClick={onRemove} title={t('admin.removeFile')}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`dropzone ${drag ? 'drag' : ''} ${busy ? 'busy' : ''}`}
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!busy) handle(e.dataTransfer.files?.[0]);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        >
          {busy ? (
            <>
              <Loader2 className="spin" size={26} />
              <span>{t('admin.uploading', { p: progress })}</span>
              <div className="progress">
                <span style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <Icon size={26} />
              <span>{t('admin.dropHint')}</span>
              <span className="btn btn-soft btn-sm">{image ? t('admin.chooseCover') : t('admin.chooseFile')}</span>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} hidden onChange={(e) => handle(e.target.files?.[0])} />
      {hint && <span className="field-hint muted small">{hint}</span>}
      {error && <span className="field-error small">{error}</span>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const { t } = useI18n();
  return (
    <span className={`status-badge ${status}`}>{status === 'published' ? t('admin.published') : t('admin.draft')}</span>
  );
}

/** Saqlash tugmalari: qoralama / nashr */
export function SaveBar({ saving, disabled, onSave, status, extra }) {
  const { t } = useI18n();
  return (
    <div className="save-bar">
      {extra}
      <span className="spacer" />
      <button type="button" className="btn btn-outline" disabled={saving || disabled} onClick={() => onSave('draft')}>
        {saving === 'draft' ? t('admin.saving') : t('admin.saveDraft')}
      </button>
      <button type="button" className="btn btn-primary" disabled={saving || disabled} onClick={() => onSave('published')}>
        {saving === 'published' ? t('admin.saving') : status === 'published' ? t('admin.save') : t('admin.savePublish')}
      </button>
    </div>
  );
}
