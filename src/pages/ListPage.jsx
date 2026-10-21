import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { useAsync, useTopics } from '../lib/hooks';
import { listItems } from '../lib/api';
import { SECTIONS, MATERIAL_TYPES } from '../lib/constants';
import { Filters } from '../components/Filters';
import { ItemCard } from '../components/ItemCard';
import { EmptyState, ErrorBox, Spinner } from '../components/States';
import { PageHeader } from '../components/PageHeader';

/** Har qanday bo'lim ro'yxati: sectionKey = lesson_plan | video | ... | animation | test */
export default function ListPage({ sectionKey }) {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const { topics } = useTopics();
  const section = SECTIONS.find((s) => s.key === sectionKey);
  const isMaterial = section.table === 'materials';
  const kind = isMaterial ? 'material' : sectionKey;

  const filters = {
    type: isMaterial ? sectionKey : undefined,
    grade: params.get('grade') || undefined,
    topic_id: params.get('topic') || undefined,
    category: params.get('category') || undefined,
    search: params.get('q') || undefined,
    status: 'published',
  };
  const key = JSON.stringify(filters);
  const { data, loading, error, reload } = useAsync(() => listItems(section.table, filters), [key]);
  const filtered = Boolean(filters.grade || filters.topic_id || filters.category || filters.search);

  const addTo =
    sectionKey === 'animation' ? '/admin/animations/new' : sectionKey === 'test' ? '/admin/tests/new' : `/admin/materials/${sectionKey}/new`;

  return (
    <div className="container page">
      <PageHeader icon={section.icon} color={section.color} title={t(`nav.${sectionKey}`)} text={t(`sectionDesc.${sectionKey}`)} />
      <Filters
        params={params}
        setParams={setParams}
        topics={topics}
        categories={isMaterial ? MATERIAL_TYPES[sectionKey].categories : []}
      />
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState icon={section.icon} filtered={filtered} addTo={addTo} />
      ) : (
        <>
          <p className="muted small results-count">{t('results', { n: data.length })}</p>
          <div className="grid cards-grid">
            {data.map((item) => (
              <ItemCard key={item.id} item={item} kind={kind} topics={topics} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
