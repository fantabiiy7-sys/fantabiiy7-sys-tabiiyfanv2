import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Layers, PlayCircle, Sparkles, Search, X, SlidersHorizontal, SearchX } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAsync, useDebounced, useTopics } from '../lib/hooks';
import { listItems } from '../lib/api';
import { GRADES } from '../lib/constants';
import { localized } from '../lib/utils';
import { EmptyState, ErrorBox } from '../components/States';
import { TestCard, TestCardSkeleton, isNewItem, questionCount } from '../components/TestCard';

/**
 * Testlar bazasi (/tests). Ma'lumotlar avvalgidek listItems('tests', ...) orqali olinadi;
 * format va saralash faqat brauzerda, yuklangan ro'yxat ustida qo'llanadi.
 */
export default function TestsCatalog() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const { topics } = useTopics();

  const grade = params.get('grade') || '';
  const topic = params.get('topic') || '';
  const format = params.get('format') || '';
  const sort = params.get('sort') || '';
  const [q, setQ] = useState(params.get('q') || '');
  const dq = useDebounced(q, 350);

  function update(patch) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  }

  useEffect(() => {
    if ((params.get('q') || '') !== dq) update({ q: dq });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

  const filters = {
    grade: grade || undefined,
    topic_id: topic || undefined,
    search: params.get('q') || undefined,
    status: 'published',
  };
  const { data, loading, error, reload } = useAsync(() => listItems('tests', filters), [JSON.stringify(filters)]);
  // Umumiy statistika uchun — filtrsiz, faqat nashr qilingan testlar
  const stats = useAsync(() => listItems('tests', { status: 'published' }), []);

  const summary = useMemo(() => {
    const all = stats.data || [];
    return {
      total: all.length,
      topics: new Set(all.map((x) => x.topic_id).filter(Boolean)).size,
      online: all.filter((x) => questionCount(x) > 0).length,
      fresh: all.filter(isNewItem).length,
    };
  }, [stats.data]);

  const list = useMemo(() => {
    let rows = data || [];
    if (format === 'online') rows = rows.filter((x) => questionCount(x) > 0);
    if (format === 'file') rows = rows.filter((x) => questionCount(x) === 0);
    if (sort === 'questions') rows = [...rows].sort((a, b) => questionCount(b) - questionCount(a));
    if (sort === 'title')
      rows = [...rows].sort((a, b) => localized(a, 'title', lang).localeCompare(localized(b, 'title', lang), lang));
    return rows;
  }, [data, format, sort, lang]);

  const visibleTopics = topics.filter((x) => !grade || String(x.grade) === grade);
  const hasFilters = Boolean(grade || topic || format || q);

  const statCards = [
    { key: 'total', icon: ClipboardCheck, label: t('test.statTotal'), value: summary.total, tone: 'blue' },
    { key: 'topics', icon: Layers, label: t('test.statTopics'), value: summary.topics, tone: 'indigo' },
    { key: 'online', icon: PlayCircle, label: t('test.statOnline'), value: summary.online, tone: 'green' },
    { key: 'fresh', icon: Sparkles, label: t('test.statNew'), value: summary.fresh, tone: 'orange' },
  ];

  return (
    <div className="container page catalog">
      <header className="catalog-head">
        <div>
          <span className="eyebrow">{t('subject')} · {t('nav.test')}</span>
          <h1>{t('test.catalogTitle')}</h1>
          <p className="muted">{t('test.catalogText')}</p>
        </div>
      </header>

      <section className="stat-grid" aria-label={t('test.catalogTitle')}>
        {statCards.map((s) => (
          <div key={s.key} className="stat-card">
            <span className={`stat-icon tone-${s.tone}`}>
              <s.icon size={20} />
            </span>
            <div className="stat-body">
              <span className="stat-value">{stats.loading ? <span className="sk sk-num" /> : s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="filter-panel" aria-label={t('search')}>
        <div className="filter-panel-row">
          <label className="search-field">
            <Search size={18} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('search')}
            />
            {q && (
              <button type="button" className="search-clear" onClick={() => setQ('')} aria-label={t('clearFilters')}>
                <X size={16} />
              </button>
            )}
          </label>
          <div className="seg" role="tablist" aria-label={t('grade')}>
            <button role="tab" aria-selected={!grade} className={!grade ? 'active' : ''} onClick={() => update({ grade: '', topic: '' })}>
              {t('allGrades')}
            </button>
            {GRADES.map((g) => (
              <button
                key={g}
                role="tab"
                aria-selected={grade === String(g)}
                className={grade === String(g) ? 'active' : ''}
                onClick={() => update({ grade: String(g), topic: '' })}
              >
                {t('gradeN', { n: g })}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-panel-row">
          <span className="filter-label">
            <SlidersHorizontal size={16} />
          </span>
          <label className="select-field">
            <span>{t('topic')}</span>
            <select value={topic} onChange={(e) => update({ topic: e.target.value })}>
              <option value="">{t('allTopics')}</option>
              {visibleTopics.map((x) => (
                <option key={x.id} value={x.id}>
                  {grade ? '' : `${x.grade} · `}
                  {localized(x, 'title', lang)}
                </option>
              ))}
            </select>
          </label>
          <label className="select-field">
            <span>{t('test.format')}</span>
            <select value={format} onChange={(e) => update({ format: e.target.value })}>
              <option value="">{t('test.allFormats')}</option>
              <option value="online">{t('test.formatOnline')}</option>
              <option value="file">{t('test.formatFile')}</option>
            </select>
          </label>
          <label className="select-field">
            <span>{t('test.sort')}</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
              <option value="">{t('test.sortNew')}</option>
              <option value="questions">{t('test.sortQuestions')}</option>
              <option value="title">{t('test.sortTitle')}</option>
            </select>
          </label>
          {hasFilters && (
            <button
              type="button"
              className="btn btn-ghost btn-sm clear-btn"
              onClick={() => {
                setQ('');
                const next = new URLSearchParams();
                if (sort) next.set('sort', sort);
                setParams(next, { replace: true });
              }}
            >
              <X size={16} /> {t('clearFilters')}
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="test-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <TestCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : !list.length ? (
        <EmptyState
          icon={hasFilters ? SearchX : ClipboardCheck}
          filtered={hasFilters}
          addTo={hasFilters ? undefined : '/admin/tests/new'}
        />
      ) : (
        <>
          <div className="results-bar">
            <span>{t('test.resultsN', { n: list.length })}</span>
          </div>
          <div className="test-grid">
            {list.map((item) => (
              <TestCard key={item.id} item={item} topics={topics} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
