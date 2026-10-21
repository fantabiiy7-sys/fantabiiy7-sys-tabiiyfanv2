import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { GRADES } from '../lib/constants';
import { localized } from '../lib/utils';
import { useDebounced } from '../lib/hooks';

/**
 * Sinf, mavzu, tur va matn bo'yicha filtr. Qiymatlar URL query parametrlarida saqlanadi.
 */
export function Filters({ params, setParams, topics, categories = [] }) {
  const { t, lang } = useI18n();
  const grade = params.get('grade') || '';
  const topic = params.get('topic') || '';
  const category = params.get('category') || '';
  const [q, setQ] = useState(params.get('q') || '');
  const dq = useDebounced(q, 350);

  useEffect(() => {
    if ((params.get('q') || '') !== dq) update({ q: dq });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

  function update(patch) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  }

  const visibleTopics = topics.filter((x) => !grade || String(x.grade) === grade);
  const hasFilters = grade || topic || category || q;

  return (
    <div className="filters">
      <div className="grade-tabs" role="tablist" aria-label={t('grade')}>
        <button className={!grade ? 'active' : ''} onClick={() => update({ grade: '', topic: '' })}>
          {t('allGrades')}
        </button>
        {GRADES.map((g) => (
          <button
            key={g}
            className={grade === String(g) ? 'active' : ''}
            onClick={() => update({ grade: String(g), topic: '' })}
          >
            {t('gradeN', { n: g })}
          </button>
        ))}
      </div>
      <div className="filter-row">
        <label className="search-field">
          <Search size={18} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('search')}
          />
        </label>
        <select value={topic} onChange={(e) => update({ topic: e.target.value })} aria-label={t('topic')}>
          <option value="">{t('allTopics')}</option>
          {visibleTopics.map((x) => (
            <option key={x.id} value={x.id}>
              {grade ? '' : `${x.grade} · `}
              {localized(x, 'title', lang)}
            </option>
          ))}
        </select>
        {categories.length > 0 && (
          <select value={category} onChange={(e) => update({ category: e.target.value })} aria-label={t('category')}>
            <option value="">{t('allCategories')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {t(`categories.${c}`)}
              </option>
            ))}
          </select>
        )}
        {hasFilters && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setQ('');
              setParams(new URLSearchParams(), { replace: true });
            }}
          >
            <X size={16} /> {t('clearFilters')}
          </button>
        )}
      </div>
    </div>
  );
}
