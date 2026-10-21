import { Link } from 'react-router-dom';
import { ClipboardCheck, FileText, ListChecks, Paperclip, Play, Calendar, ArrowRight } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { formatDate, localized } from '../lib/utils';

const NEW_DAYS = 30;

/** Savollar soni (bo'sh savollar hisobga olinmaydi — test sahifasidagi kabi) */
export function questionCount(item) {
  return Array.isArray(item?.questions) ? item.questions.filter((q) => q?.question).length : 0;
}

export function isNewItem(item) {
  const d = new Date(item?.published_at || item?.created_at);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() < NEW_DAYS * 864e5;
}

/** Testlar bazasidagi bitta test kartasi */
export function TestCard({ item, topics = [] }) {
  const { t, lang } = useI18n();
  const topic = topics.find((x) => x.id === item.topic_id);
  const title = localized(item, 'title', lang);
  const desc = localized(item, 'description', lang);
  const n = questionCount(item);
  const online = n > 0;
  const href = `/tests/${item.id}`;

  return (
    <article className="test-card">
      <div className="test-card-top">
        <span className={`test-card-icon ${online ? 'tone-blue' : 'tone-teal'}`} aria-hidden="true">
          {online ? <ClipboardCheck size={20} /> : <FileText size={20} />}
        </span>
        <div className="test-card-tags">
          <span className="tag tag-subject">{t('subject')}</span>
          {item.grade && <span className="tag">{t('gradeN', { n: item.grade })}</span>}
          {isNewItem(item) && <span className="tag tag-new">{t('test.newBadge')}</span>}
        </div>
      </div>

      <h3 className="test-card-title">
        <Link to={href}>{title}</Link>
      </h3>
      {topic ? (
        <p className="test-card-topic truncate" title={localized(topic, 'title', lang)}>
          {localized(topic, 'title', lang)}
        </p>
      ) : (
        <p className="test-card-topic muted">{t('noTopic')}</p>
      )}
      {desc && <p className="test-card-desc">{desc}</p>}

      <dl className="test-card-facts">
        <div>
          <dt>
            <ListChecks size={15} /> {t('test.infoQuestions')}
          </dt>
          <dd>{online ? n : '—'}</dd>
        </div>
        <div>
          <dt>{t('test.format')}</dt>
          <dd>
            <span className={`state-pill ${online ? 'is-online' : 'is-file'}`}>
              {online ? t('test.formatOnline') : t('test.formatFile')}
            </span>
          </dd>
        </div>
      </dl>

      <div className="test-card-foot">
        <span className="test-card-meta">
          <Calendar size={14} /> {formatDate(item.published_at || item.created_at, lang)}
          {item.file_path && (
            <span className="test-card-clip" title={t('test.withFile')}>
              <Paperclip size={14} />
            </span>
          )}
        </span>
        <Link to={href} className={`btn btn-sm ${online ? 'btn-primary' : 'btn-outline'}`}>
          {online ? (
            <>
              <Play size={15} /> {t('test.start')}
            </>
          ) : (
            <>
              {t('test.view')} <ArrowRight size={15} />
            </>
          )}
        </Link>
      </div>
    </article>
  );
}

/** Yuklanayotgandagi karta skeleti */
export function TestCardSkeleton() {
  return (
    <div className="test-card skeleton-card" aria-hidden="true">
      <div className="sk sk-row">
        <span className="sk sk-icon" />
        <span className="sk sk-tag" />
        <span className="sk sk-tag" />
      </div>
      <span className="sk sk-line lg" />
      <span className="sk sk-line w60" />
      <span className="sk sk-block" />
      <span className="sk sk-line w40" />
    </div>
  );
}
