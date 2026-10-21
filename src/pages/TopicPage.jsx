import { useParams, Link } from 'react-router-dom';
import { BookMarked, ArrowLeft } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAsync, useTopics } from '../lib/hooks';
import { listItems } from '../lib/api';
import { localized } from '../lib/utils';
import { SECTIONS } from '../lib/constants';
import { PageHeader } from '../components/PageHeader';
import { ItemCard } from '../components/ItemCard';
import { EmptyState, ErrorBox, Spinner } from '../components/States';

/** Bitta dars mavzusiga tegishli barcha bo'limlardagi materiallar */
export default function TopicPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { topics, loading: tl } = useTopics();
  const topic = topics.find((x) => x.id === id);

  const { data, loading, error, reload } = useAsync(async () => {
    const [m, a, ts] = await Promise.all([
      listItems('materials', { topic_id: id, status: 'published' }),
      listItems('animations', { topic_id: id, status: 'published' }),
      listItems('tests', { topic_id: id, status: 'published' }),
    ]);
    return { m, a, ts };
  }, [id]);

  if (tl || loading) return <Spinner />;
  const total = data ? data.m.length + data.a.length + data.ts.length : 0;

  return (
    <div className="container page">
      {topic && (
        <Link to={`/grade/${topic.grade}`} className="back-link">
          <ArrowLeft size={16} /> {t('gradeN', { n: topic.grade })}
        </Link>
      )}
      <PageHeader icon={BookMarked} color="blue" title={topic ? localized(topic, 'title', lang) : t('topic')} text={topic ? `${t('subject')} · ${t('gradeN', { n: topic.grade })}` : ''} />
      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : !total ? (
        <EmptyState addTo="/admin" />
      ) : (
        SECTIONS.map((s) => {
          const items =
            s.table === 'materials' ? data.m.filter((x) => x.type === s.key) : s.key === 'animation' ? data.a : data.ts;
          if (!items.length) return null;
          const kind = s.table === 'materials' ? 'material' : s.key;
          return (
            <section key={s.key} className="topic-section">
              <h2 className="sub-title">
                <span className={`mini-icon tone-${s.color}`}>
                  <s.icon size={16} />
                </span>
                {t(`nav.${s.key}`)}
              </h2>
              <div className="grid cards-grid">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} kind={kind} topics={topics} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
