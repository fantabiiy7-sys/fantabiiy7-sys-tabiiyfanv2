import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Play, Monitor, Tablet, Smartphone, AlertTriangle, ShieldCheck, Copy, Trash2,
  LayoutTemplate, FilePlus2, Maximize2, Minimize2,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { useDebounced, useTopics } from '../lib/hooks';
import { deleteItem, getItem, listItems, saveItem } from '../lib/api';
import { removeFiles } from '../lib/storage';
import { localized } from '../lib/utils';
import { SandboxFrame } from '../components/SandboxFrame';
import { Spinner, EmptyState } from '../components/States';
import { Field, FileField, GradeTopicFields, SaveBar, StatusBadge, TranslationFields } from './FormParts';
import CodeEditor from './CodeEditor';

const EMPTY = {
  title: '',
  description: '',
  translations: {},
  grade: null,
  topic_id: null,
  html: '',
  css: '',
  js: '',
  cover_path: null,
  is_template: false,
  status: 'draft',
};

const DEVICES = { desktop: '100%', tablet: '768px', mobile: '375px' };

function TemplatePicker({ onPick, onBlank }) {
  const { t, lang } = useI18n();
  const [templates, setTemplates] = useState(null);
  useEffect(() => {
    listItems('animations', { onlyTemplates: true })
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);
  if (templates === null) return <Spinner />;
  if (!templates.length) return null;
  return (
    <div className="card template-picker">
      <h3>
        <LayoutTemplate size={18} /> {t('admin.fromTemplate')}
      </h3>
      <div className="template-grid">
        <button className="template-tile blank" onClick={onBlank}>
          <FilePlus2 size={22} /> {t('admin.blank')}
        </button>
        {templates.map((tpl) => (
          <button key={tpl.id} className="template-tile" onClick={() => onPick(tpl.id)}>
            <LayoutTemplate size={22} />
            <span>{localized(tpl, 'title', lang)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AnimationEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const { topics } = useTopics();
  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [pickTemplate, setPickTemplate] = useState(isNew);
  const [tab, setTab] = useState('html');
  const [device, setDevice] = useState('desktop');
  const [auto, setAuto] = useState(true);
  const [runKey, setRunKey] = useState(0);
  const [manual, setManual] = useState({ html: '', css: '', js: '' });
  const [previewError, setPreviewError] = useState('');
  const [saving, setSaving] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [wide, setWide] = useState(false);
  const saveRef = useRef(null);

  useEffect(() => {
    if (isNew) return;
    getItem('animations', id)
      .then((row) => {
        if (!row) return setNotFound(true);
        setForm({ ...EMPTY, ...row });
        setOriginal(row);
        setManual({ html: row.html, css: row.css, js: row.js });
      })
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, isNew, toast]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const set = useCallback((patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  }, []);

  const code = useMemo(() => ({ html: form.html, css: form.css, js: form.js }), [form.html, form.css, form.js]);
  const debounced = useDebounced(code, 600);
  const previewCode = auto ? debounced : manual;

  useEffect(() => {
    setPreviewError('');
  }, [previewCode, runKey]);

  async function applyTemplate(tplId) {
    try {
      const tpl = await getItem('animations', tplId);
      if (tpl) {
        setForm((f) => ({ ...f, html: tpl.html, css: tpl.css, js: tpl.js }));
        setManual({ html: tpl.html, css: tpl.css, js: tpl.js });
      }
    } catch (e) {
      toast(e.message, 'error');
    }
    setPickTemplate(false);
  }

  function run() {
    setManual(code);
    setRunKey((k) => k + 1);
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = t('admin.titleRequired');
    setErrors(e);
    if (e.title) window.scrollTo({ top: 0, behavior: 'smooth' });
    return !e.title;
  }

  async function save(status, opts = {}) {
    if (!validate()) return;
    setSaving(status);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        status: opts.asTemplate ? 'draft' : status,
      };
      if (opts.asTemplate) {
        delete payload.id;
        payload.is_template = true;
        payload.cover_path = null;
      }
      const saved = await saveItem('animations', payload);
      if (!opts.asTemplate && original?.cover_path && original.cover_path !== saved.cover_path) {
        removeFiles([original.cover_path]).catch(() => {});
      }
      setDirty(false);
      toast(t('admin.saved'));
      if (opts.asTemplate) return;
      if (opts.stay) {
        setOriginal(saved);
        setForm({ ...EMPTY, ...saved });
        if (isNew) navigate(`/admin/animations/${saved.id}`, { replace: true });
      } else {
        navigate('/admin/animations');
      }
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(null);
    }
  }
  saveRef.current = () => save(form.status || 'draft', { stay: true });

  async function remove() {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteItem('animations', original);
      setDirty(false);
      toast(t('admin.deleted'));
      navigate('/admin/animations');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  if (loading) return <Spinner />;
  if (notFound) return <EmptyState title={t('admin.notFound')} text=" " />;

  const tabs = [
    { key: 'html', label: t('admin.editorHtml') },
    { key: 'css', label: t('admin.editorCss') },
    { key: 'js', label: t('admin.editorJs') },
  ];

  return (
    <div className="form-page wide">
      <Link to="/admin/animations" className="back-link">
        <ArrowLeft size={16} /> {t('nav.animation')}
      </Link>
      <div className="admin-head">
        <div className="page-header-main">
          <h1>{isNew ? t('admin.addNew') : t('admin.edit')}</h1>
          {!isNew && <StatusBadge status={form.status} />}
          {form.is_template && <span className="chip tone-purple">{t('admin.templates')}</span>}
        </div>
      </div>

      {pickTemplate && <TemplatePicker onPick={applyTemplate} onBlank={() => setPickTemplate(false)} />}

      <div className="card form-card">
        <Field label={t('admin.title')} required error={errors.title}>
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={300} />
        </Field>
        <GradeTopicFields value={form} onChange={set} topics={topics} gradeOptional />
        <Field label={t('admin.descriptionField')}>
          <textarea rows={3} value={form.description || ''} onChange={(e) => set({ description: e.target.value })} />
        </Field>
      </div>

      <div className={`anim-editor ${wide ? 'stacked' : ''}`}>
        <div className="card editor-pane">
          <div className="editor-tabs">
            {tabs.map((x) => (
              <button key={x.key} className={tab === x.key ? 'active' : ''} onClick={() => setTab(x.key)}>
                {x.label}
                {form[x.key] ? <span className="dot" /> : null}
              </button>
            ))}
            <span className="spacer" />
            <button className="icon-btn sm hide-md" onClick={() => setWide((w) => !w)} title="layout">
              {wide ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          <CodeEditor
            key={tab}
            language={tab}
            value={form[tab]}
            onChange={(v) => set({ [tab]: v })}
            onSave={() => saveRef.current?.()}
            placeholder={tab === 'html' ? '<div id="app"></div>' : tab === 'css' ? '#app { … }' : "document.getElementById('app')…"}
          />
        </div>

        <div className="card preview-pane">
          <div className="preview-toolbar">
            <strong className="small">{t('admin.livePreview')}</strong>
            <span className="spacer" />
            <div className="segmented sm" title={t('admin.device')}>
              {[
                ['desktop', Monitor],
                ['tablet', Tablet],
                ['mobile', Smartphone],
              ].map(([k, Icon]) => (
                <button key={k} className={device === k ? 'active' : ''} onClick={() => setDevice(k)} title={t(`admin.${k}`)}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
            <label className="switch small">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              <span>{t('admin.autoRefresh')}</span>
            </label>
            <button className="btn btn-success btn-sm" onClick={run}>
              <Play size={15} /> {t('admin.runPreview')}
            </button>
          </div>
          <div className="preview-stage">
            <div className="preview-device" style={{ width: DEVICES[device] }}>
              <SandboxFrame {...previewCode} runKey={runKey} onError={setPreviewError} title="preview" />
            </div>
          </div>
          {previewError && (
            <div className="preview-error small">
              <AlertTriangle size={15} /> {t('admin.previewError')}: {previewError}
            </div>
          )}
          <p className="muted small sandbox-note">
            <ShieldCheck size={14} /> {t('admin.sandboxNote')}
          </p>
        </div>
      </div>

      <div className="card form-card">
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
        <label className="switch">
          <input type="checkbox" checked={form.is_template} onChange={(e) => set({ is_template: e.target.checked })} />
          <span>{t('admin.isTemplate')}</span>
        </label>
        <TranslationFields value={form.translations} onChange={(translations) => set({ translations })} />
      </div>

      <SaveBar
        saving={saving}
        disabled={uploading}
        status={original?.status}
        onSave={(s) => save(s)}
        extra={
          <>
            {!isNew && (
              <button type="button" className="btn btn-danger-ghost" onClick={remove}>
                <Trash2 size={16} /> {t('admin.delete')}
              </button>
            )}
            {!form.is_template && (
              <button type="button" className="btn btn-ghost" onClick={() => save('draft', { asTemplate: true })} disabled={Boolean(saving)}>
                <Copy size={16} /> {t('admin.saveAsTemplate')}
              </button>
            )}
          </>
        }
      />
    </div>
  );
}
