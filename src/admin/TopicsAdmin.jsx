import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, BookMarked, Info, Languages } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { useTopics } from '../lib/hooks';
import { deleteTopic, saveTopic } from '../lib/api';
import { GRADES } from '../lib/constants';
import { Spinner } from '../components/States';

function TopicEditor({ initial, onSave, onCancel }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initial.title || '');
  const [ru, setRu] = useState(initial.translations?.ru?.title || '');
  const [en, setEn] = useState(initial.translations?.en?.title || '');
  const [order, setOrder] = useState(initial.sort_order ?? 0);
  const [showTr, setShowTr] = useState(Boolean(ru || en));
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const translations = {};
    if (ru.trim()) translations.ru = { title: ru.trim() };
    if (en.trim()) translations.en = { title: en.trim() };
    await onSave({ ...initial, title: title.trim(), translations, sort_order: Number(order) || 0 });
    setBusy(false);
  }

  return (
    <form className="topic-editor" onSubmit={submit}>
      <div className="topic-editor-row">
        <input
          className="order-input"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          title={t('admin.order')}
          aria-label={t('admin.order')}
        />
        <input
          autoFocus
          placeholder={t('admin.topicTitle')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          required
        />
        <button type="button" className="icon-btn sm" onClick={() => setShowTr((s) => !s)} title={t('admin.translations')}>
          <Languages size={16} />
        </button>
        <button className="btn btn-primary btn-sm" disabled={busy || !title.trim()}>
          <Check size={16} /> {t('admin.save')}
        </button>
        <button type="button" className="icon-btn sm" onClick={onCancel} title={t('admin.cancel')}>
          <X size={16} />
        </button>
      </div>
      {showTr && (
        <div className="topic-editor-row tr">
          <input placeholder={t('admin.titleRu')} value={ru} onChange={(e) => setRu(e.target.value)} />
          <input placeholder={t('admin.titleEn')} value={en} onChange={(e) => setEn(e.target.value)} />
        </div>
      )}
    </form>
  );
}

export default function TopicsAdmin() {
  const { t } = useI18n();
  const toast = useToast();
  const { topics, loading, reload } = useTopics();
  const [grade, setGrade] = useState(5);
  const [editing, setEditing] = useState(null); // topic id | 'new'

  const list = topics.filter((x) => x.grade === grade);
  const nextOrder = list.length ? Math.max(...list.map((x) => x.sort_order || 0)) + 1 : 1;

  async function save(topic) {
    try {
      await saveTopic({
        id: topic.id,
        grade: topic.grade,
        title: topic.title,
        translations: topic.translations,
        sort_order: topic.sort_order,
      });
      toast(t('admin.saved'));
      setEditing(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  async function remove(topic) {
    if (!window.confirm(`${t('admin.confirmDelete')}\n\n${t('admin.topicDeleteNote')}`)) return;
    try {
      await deleteTopic(topic.id);
      toast(t('admin.deleted'));
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin-head">
        <div className="page-header-main">
          <span className="page-icon tone-blue">
            <BookMarked size={24} />
          </span>
          <h1>{t('admin.topics')}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Plus size={18} /> {t('admin.newTopic')}
        </button>
      </div>
      <p className="muted small info-line">
        <Info size={14} /> {t('admin.topicDeleteNote')}
      </p>
      <div className="grade-tabs">
        {GRADES.map((g) => (
          <button
            key={g}
            className={grade === g ? 'active' : ''}
            onClick={() => {
              setGrade(g);
              setEditing(null);
            }}
          >
            {t('gradeN', { n: g })} <span className="count">{topics.filter((x) => x.grade === g).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="card topics-card">
          {editing === 'new' && (
            <TopicEditor initial={{ grade, sort_order: nextOrder, translations: {} }} onSave={save} onCancel={() => setEditing(null)} />
          )}
          {!list.length && editing !== 'new' && (
            <div className="empty compact">
              <p className="muted">{t('admin.noTopics')}</p>
              <button className="btn btn-primary" onClick={() => setEditing('new')}>
                <Plus size={18} /> {t('admin.newTopic')}
              </button>
            </div>
          )}
          <ul className="topic-admin-list">
            {list.map((topic) =>
              editing === topic.id ? (
                <li key={topic.id}>
                  <TopicEditor initial={topic} onSave={save} onCancel={() => setEditing(null)} />
                </li>
              ) : (
                <li key={topic.id} className="topic-admin-row">
                  <span className="topic-num">{topic.sort_order}</span>
                  <span className="topic-name">
                    {topic.title}
                    {(topic.translations?.ru?.title || topic.translations?.en?.title) && (
                      <small className="muted block">
                        {[topic.translations?.ru?.title, topic.translations?.en?.title].filter(Boolean).join(' · ')}
                      </small>
                    )}
                  </span>
                  <button className="icon-btn sm" onClick={() => setEditing(topic.id)} title={t('admin.rename')}>
                    <Pencil size={16} />
                  </button>
                  <button className="icon-btn sm danger" onClick={() => remove(topic)} title={t('admin.delete')}>
                    <Trash2 size={16} />
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
