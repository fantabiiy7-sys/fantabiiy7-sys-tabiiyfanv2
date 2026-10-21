import { useRef, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, RotateCcw, Pencil, BookMarked } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useAsync, useTopics } from '../lib/hooks';
import { getItem } from '../lib/api';
import { formatDate, localized } from '../lib/utils';
import { SandboxFrame } from '../components/SandboxFrame';
import { EmptyState, ErrorBox, Spinner } from '../components/States';
import { CopyLinkButton } from './MaterialDetail';

export default function AnimationView() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { isAdmin } = useAuth();
  const { topics } = useTopics();
  const { data: item, loading, error, reload } = useAsync(() => getItem('animations', id), [id]);
  const [runKey, setRunKey] = useState(0);
  const [isFs, setIsFs] = useState(false);
  const stageRef = useRef(null);

  useEffect(() => {
    const h = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="container page"><ErrorBox error={error} onRetry={reload} /></div>;
  if (!item) return <div className="container page"><EmptyState title={t('admin.notFound')} text=" " /></div>;

  const topic = topics.find((x) => x.id === item.topic_id);
  const desc = localized(item, 'description', lang);

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stageRef.current?.requestFullscreen?.();
  };

  return (
    <div className="container page">
      <Link to="/animations" className="back-link">
        <ArrowLeft size={16} /> {t('nav.animation')}
      </Link>
      <div className="chips">
        <span className="chip tone-teal">{t('animation.interactive')}</span>
        {item.grade && <span className="chip">{t('gradeN', { n: item.grade })}</span>}
        {topic && (
          <Link to={`/topic/${topic.id}`} className="chip">
            <BookMarked size={13} /> {localized(topic, 'title', lang)}
          </Link>
        )}
        {item.status === 'draft' && <span className="chip tone-orange">{t('admin.draft')}</span>}
      </div>
      <h1 className="detail-title">{localized(item, 'title', lang)}</h1>

      <div className={`anim-stage card ${isFs ? 'is-fs' : ''}`} ref={stageRef}>
        <div className="anim-toolbar">
          <button className="btn btn-ghost btn-sm" onClick={() => setRunKey((k) => k + 1)}>
            <RotateCcw size={16} /> {t('animation.restart')}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={toggleFs}>
            {isFs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFs ? t('animation.exitFullscreen') : t('animation.fullscreen')}
          </button>
        </div>
        <SandboxFrame html={item.html} css={item.css} js={item.js} runKey={runKey} title={item.title} className="anim-frame" />
      </div>

      <div className="anim-info">
        <div>
          {desc && <p className="pre-wrap">{desc}</p>}
          <p className="muted small">
            {t('addedOn')}: {formatDate(item.published_at || item.created_at, lang)}
          </p>
        </div>
        <div className="row-actions">
          <CopyLinkButton />
          {isAdmin && (
            <Link className="btn btn-soft" to={`/admin/animations/${item.id}`}>
              <Pencil size={16} /> {t('admin.edit')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
