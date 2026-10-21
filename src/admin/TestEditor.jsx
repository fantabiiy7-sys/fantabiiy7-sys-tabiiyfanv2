import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, ChevronUp, ChevronDown, ClipboardCheck } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { useTopics } from '../lib/hooks';
import { deleteItem, getItem, saveItem } from '../lib/api';
import { removeFiles } from '../lib/storage';
import { Spinner, EmptyState } from '../components/States';
import { Field, FileField, GradeTopicFields, SaveBar, StatusBadge, TranslationFields } from './FormParts';

const EMPTY = {
  title: '',
  description: '',
  translations: {},
  grade: null,
  topic_id: null,
  questions: [],
  file_path: null,
  file_name: null,
  file_size: null,
  file_mime: null,
  status: 'draft',
};

const newQuestion = () => ({ question: '', options: ['', '', '', ''], correct: 0, explanation: '' });

export default function TestEditor() {
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
  const [saving, setSaving] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isNew) return;
    getItem('tests', id)
      .then((row) => {
        if (!row) return setNotFound(true);
        setForm({ ...EMPTY, ...row, questions: Array.isArray(row.questions) ? row.questions : [] });
        setOriginal(row);
      })
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, isNew, toast]);

  if (loading) return <Spinner />;
  if (notFound) return <EmptyState title={t('admin.notFound')} text=" " />;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setQ = (i, patch) => set({ questions: form.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) });
  const moveQ = (i, d) => {
    const qs = [...form.questions];
    const j = i + d;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    set({ questions: qs });
  };

  function cleanQuestions() {
    return form.questions.map((q) => {
      const opts = q.options.map((o) => o.trim());
      const keep = opts.map((o, i) => [o, i]).filter(([o]) => o);
      const correctNew = Math.max(0, keep.findIndex(([, i]) => i === q.correct));
      return {
        question: q.question.trim(),
        options: keep.map(([o]) => o),
        correct: correctNew,
        explanation: q.explanation?.trim() || '',
      };
    });
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = t('admin.titleRequired');
    if (!form.grade) e.grade = t('admin.gradeRequired');
    const qs = cleanQuestions();
    const bad = qs.findIndex((q) => !q.question || q.options.length < 2);
    if (bad >= 0) e.questions = t('admin.questionInvalid', { i: bad + 1 });
    const pickedEmpty = form.questions.findIndex((q) => !q.options[q.correct]?.trim());
    if (bad < 0 && pickedEmpty >= 0) e.questions = t('admin.questionInvalid', { i: pickedEmpty + 1 });
    if (!qs.length && !form.file_path) e.questions = t('admin.fileOrUrlRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save(status) {
    if (!validate()) return;
    setSaving(status);
    try {
      const saved = await saveItem('tests', {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        questions: cleanQuestions(),
        status,
      });
      if (original?.file_path && original.file_path !== saved.file_path) removeFiles([original.file_path]).catch(() => {});
      toast(t('admin.saved'));
      navigate('/admin/tests');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(null);
    }
  }

  async function remove() {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteItem('tests', original);
      toast(t('admin.deleted'));
      navigate('/admin/tests');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  return (
    <div className="form-page">
      <Link to="/admin/tests" className="back-link">
        <ArrowLeft size={16} /> {t('nav.test')}
      </Link>
      <div className="admin-head">
        <div className="page-header-main">
          <span className="page-icon tone-indigo">
            <ClipboardCheck size={24} />
          </span>
          <h1>{isNew ? t('admin.addNew') : t('admin.edit')}</h1>
          {!isNew && <StatusBadge status={form.status} />}
        </div>
      </div>

      <div className="card form-card">
        <Field label={t('admin.title')} required error={errors.title}>
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={300} />
        </Field>
        <GradeTopicFields value={form} onChange={set} topics={topics} errors={errors} />
        <Field label={t('admin.descriptionField')}>
          <textarea rows={3} value={form.description || ''} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <FileField
          label={t('admin.attachmentOptional')}
          accept=".pdf,.doc,.docx,.odt,.ppt,.pptx,.xls,.xlsx,image/*"
          folder="tests"
          current={form.file_path ? { path: form.file_path, name: form.file_name, size: form.file_size } : null}
          onUploaded={(f) => set({ file_path: f.path, file_name: f.name, file_size: f.size, file_mime: f.mime })}
          onRemove={() => set({ file_path: null, file_name: null, file_size: null, file_mime: null })}
          onBusy={setUploading}
        />
      </div>

      <div className="questions-head">
        <h2 className="sub-title">
          {t('admin.questions')} <span className="count">{form.questions.length}</span>
        </h2>
      </div>
      {errors.questions && <p className="field-error">{errors.questions}</p>}

      {form.questions.map((q, i) => (
        <div key={i} className="card question-card">
          <div className="question-top">
            <span className="q-num">{i + 1}</span>
            <textarea
              rows={2}
              placeholder={t('admin.question')}
              value={q.question}
              onChange={(e) => setQ(i, { question: e.target.value })}
            />
            <div className="q-actions">
              <button className="icon-btn sm" onClick={() => moveQ(i, -1)} disabled={i === 0}>
                <ChevronUp size={16} />
              </button>
              <button className="icon-btn sm" onClick={() => moveQ(i, 1)} disabled={i === form.questions.length - 1}>
                <ChevronDown size={16} />
              </button>
              <button
                className="icon-btn sm danger"
                title={t('admin.removeQuestion')}
                onClick={() => set({ questions: form.questions.filter((_, j) => j !== i) })}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="options-list">
            {q.options.map((opt, oi) => (
              <div key={oi} className={`option-row ${q.correct === oi ? 'correct' : ''}`}>
                <button className="icon-btn sm" title={t('admin.markCorrect')} onClick={() => setQ(i, { correct: oi })}>
                  {q.correct === oi ? <CheckCircle2 size={18} className="text-green" /> : <Circle size={18} />}
                </button>
                <span className="opt-letter">{String.fromCharCode(65 + oi)}</span>
                <input
                  value={opt}
                  placeholder={`${t('admin.option')} ${String.fromCharCode(65 + oi)}`}
                  onChange={(e) => setQ(i, { options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                />
                {q.options.length > 2 && (
                  <button
                    className="icon-btn sm"
                    onClick={() =>
                      setQ(i, {
                        options: q.options.filter((_, j) => j !== oi),
                        correct: q.correct === oi ? 0 : q.correct > oi ? q.correct - 1 : q.correct,
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {q.options.length < 8 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setQ(i, { options: [...q.options, ''] })}>
                <Plus size={14} /> {t('admin.addOption')}
              </button>
            )}
          </div>
          <input
            className="explanation-input"
            placeholder={t('admin.explanationField')}
            value={q.explanation || ''}
            onChange={(e) => setQ(i, { explanation: e.target.value })}
          />
        </div>
      ))}

      <button className="btn btn-outline btn-block add-question" onClick={() => set({ questions: [...form.questions, newQuestion()] })}>
        <Plus size={18} /> {t('admin.addQuestion')}
      </button>

      <div className="card form-card">
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
