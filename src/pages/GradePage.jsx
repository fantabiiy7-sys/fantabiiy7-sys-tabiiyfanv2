import { Link, useParams, Navigate } from 'react-router-dom';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useTopics } from '../lib/hooks';
import { localized } from '../lib/utils';
import { SECTIONS, GRADES } from '../lib/constants';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, Spinner } from '../components/States';

export default function GradePage() {
  const { grade } = useParams();
  const g = Number(grade);
  const { t, lang } = useI18n();
  const { topics, loading } = useTopics();
  if (!GRADES.includes(g)) return <Navigate to="/" replace />;
  const list = topics.filter((x) => x.grade === g);

  return (
    <div className="container page">
      <PageHeader icon={GraduationCap} color={g === 5 ? 'blue' : 'green'} title={t('grades.title', { n: g })} text={t('home.gradeText', { n: g })} />
      <div className="quick-links">
        {SECTIONS.map((s) => (
          <Link key={s.key} to={`${s.path}?grade=${g}`} className="quick-link">
            <span className={`mini-icon tone-${s.color}`}>
              <s.icon size={16} />
            </span>
            {t(`nav.${s.key}`)}
          </Link>
        ))}
      </div>
      <h2 className="sub-title">{t('grades.topics')}</h2>
      {loading ? (
        <Spinner />
      ) : !list.length ? (
        <EmptyState title={t('grades.noTopics')} text=" " addTo="/admin/topics" />
      ) : (
        <ol className="topic-list">
          {list.map((topic, i) => (
            <li key={topic.id}>
              <Link to={`/topic/${topic.id}`} className="card topic-row">
                <span className="topic-num">{i + 1}</span>
                <span className="topic-name">{localized(topic, 'title', lang)}</span>
                <ChevronRight size={18} />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
