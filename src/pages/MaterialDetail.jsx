import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, Link2, Calendar, HardDrive, FileType, BookMarked, Pencil } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useAsync, useTopics } from '../lib/hooks';
import { getItem, listItems } from '../lib/api';
import { MATERIAL_TYPES } from '../lib/constants';
import { downloadUrl, fileExt, formatDate, formatSize, localized, publicUrl, youtubeId } from '../lib/utils';
import { FilePreview } from '../components/FilePreview';
import { ItemCard } from '../components/ItemCard';
import { EmptyState, ErrorBox, Spinner } from '../components/States';

export function CopyLinkButton() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
    >
      <Link2 size={18} /> {copied ? t('copied') : t('share')}
    </button>
  );
}

export default function MaterialDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { isAdmin } = useAuth();
  const { topics } = useTopics();
  const { data: item, loading, error, reload } = useAsync(() => getItem('materials', id), [id]);
  const related = useAsync(
    () => (item?.topic_id ? listItems('materials', { topic_id: item.topic_id, status: 'published', limit: 7 }) : []),
    [item?.topic_id]
  );

  if (loading) return <Spinner />;
  if (error) return <div className="container page"><ErrorBox error={error} onRetry={reload} /></div>;
  if (!item) return <div className="container page"><EmptyState title={t('admin.notFound')} text=" " /></div>;

  const def = MATERIAL_TYPES[item.type];
  const topic = topics.find((x) => x.id === item.topic_id);
  const title = localized(item, 'title', lang);
  const desc = localized(item, 'description', lang);
  const fileUrl = item.file_path ? publicUrl(item.file_path) : '';
  const yt = youtubeId(item.external_url);
  const relatedItems = (related.data || []).filter((x) => x.id !== item.id).slice(0, 6);

  return (
    <div className="container page">
      <Link to={def.path} className="back-link">
        <ArrowLeft size={16} /> {t(`nav.${item.type}`)}
      </Link>

      <div className="detail-layout">
        <article className="detail-main">
          <div className="chips">
            <span className={`chip tone-${def.color}`}>
              <def.icon size={14} /> {item.category ? t(`categories.${item.category}`) : t(`nav.${item.type}`)}
            </span>
            <span className="chip">{t('gradeN', { n: item.grade })}</span>
            {item.status === 'draft' && <span className="chip tone-orange">{t('admin.draft')}</span>}
          </div>
          <h1 className="detail-title">{title}</h1>

          <div className="viewer card">
            {yt ? (
              <div className="video-wrap">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : fileUrl ? (
              <FilePreview url={fileUrl} mime={item.file_mime} name={item.file_name} />
            ) : item.external_url ? (
              <FilePreview url={item.external_url} name={item.external_url.split('?')[0]} />
            ) : (
              <div className="preview-none">
                <p className="muted">{t('preview.noFile')}</p>
              </div>
            )}
          </div>

          {desc && (
            <section className="detail-desc">
              <h2 className="sub-title">{t('description')}</h2>
              <p className="pre-wrap">{desc}</p>
            </section>
          )}
        </article>

        <aside className="detail-side">
          <div className="card side-card">
            {item.cover_path && <img className="side-cover" src={publicUrl(item.cover_path)} alt="" />}
            <ul className="meta-list">
              {topic && (
                <li>
                  <BookMarked size={16} />
                  <span>
                    <small className="muted">{t('topic')}</small>
                    <Link to={`/topic/${topic.id}`}>{localized(topic, 'title', lang)}</Link>
                  </span>
                </li>
              )}
              <li>
                <Calendar size={16} />
                <span>
                  <small className="muted">{t('addedOn')}</small>
                  {formatDate(item.published_at || item.created_at, lang)}
                </span>
              </li>
              {item.file_name && (
                <li>
                  <FileType size={16} />
                  <span>
                    <small className="muted">{t('format')}</small>
                    {fileExt(item.file_name).toUpperCase() || '—'}
                  </span>
                </li>
              )}
              {item.file_size ? (
                <li>
                  <HardDrive size={16} />
                  <span>
                    <small className="muted">{t('fileSize')}</small>
                    {formatSize(item.file_size)}
                  </span>
                </li>
              ) : null}
            </ul>
            <div className="side-actions">
              {item.file_path && (
                <a className="btn btn-primary btn-block" href={downloadUrl(item.file_path, item.file_name)}>
                  <Download size={18} /> {t('download')}
                </a>
              )}
              {fileUrl && (
                <a className="btn btn-outline btn-block" href={fileUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} /> {t('open')}
                </a>
              )}
              {!item.file_path && item.external_url && (
                <a className="btn btn-outline btn-block" href={item.external_url} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} /> {t('video.openExternal')}
                </a>
              )}
              <CopyLinkButton />
              {isAdmin && (
                <Link className="btn btn-soft btn-block" to={`/admin/materials/${item.type}/${item.id}`}>
                  <Pencil size={16} /> {t('admin.edit')}
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>

      {relatedItems.length > 0 && (
        <section className="section">
          <h2 className="sub-title">{t('related')}</h2>
          <div className="grid cards-grid">
            {relatedItems.map((x) => (
              <ItemCard key={x.id} item={x} topics={topics} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
