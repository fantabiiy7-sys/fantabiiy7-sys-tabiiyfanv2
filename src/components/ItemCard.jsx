import { Link } from 'react-router-dom';
import { PlayCircle, FileText, Sparkles, ClipboardCheck, Calendar } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { MATERIAL_TYPES } from '../lib/constants';
import { formatDate, localized, publicUrl, youtubeId, fileExt } from '../lib/utils';

/** Material, animatsiya yoki test kartasi */
export function ItemCard({ item, kind = 'material', topics = [] }) {
  const { t, lang } = useI18n();
  const topic = topics.find((x) => x.id === item.topic_id);
  const title = localized(item, 'title', lang);
  const desc = localized(item, 'description', lang);

  let href, Icon, color, label;
  if (kind === 'animation') {
    href = `/animations/${item.id}`;
    Icon = Sparkles;
    color = 'teal';
    label = t('animation.interactive');
  } else if (kind === 'test') {
    href = `/tests/${item.id}`;
    Icon = ClipboardCheck;
    color = 'indigo';
    label = Array.isArray(item.questions) && item.questions.length
      ? t('test.questions', { n: item.questions.length })
      : t('nav.test');
  } else {
    const def = MATERIAL_TYPES[item.type] || MATERIAL_TYPES.lesson_plan;
    href = `/material/${item.id}`;
    Icon = def.icon || FileText;
    color = def.color;
    label = item.category ? t(`categories.${item.category}`) : t(`nav.${item.type}`);
  }

  let cover = item.cover_path ? publicUrl(item.cover_path) : '';
  const yt = kind === 'material' && item.type === 'video' ? youtubeId(item.external_url) : null;
  if (!cover && yt) cover = `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`;
  if (!cover && kind === 'material' && item.file_mime?.startsWith('image/')) cover = publicUrl(item.file_path);
  const ext = fileExt(item.file_name);

  return (
    <Link to={href} className="card item-card">
      <div className={`item-cover tone-${color}`}>
        {cover ? <img src={cover} alt="" loading="lazy" /> : <Icon size={44} strokeWidth={1.5} />}
        {item.type === 'video' && cover && (
          <span className="play-badge">
            <PlayCircle size={40} />
          </span>
        )}
        {ext && <span className="ext-badge">{ext}</span>}
      </div>
      <div className="item-body">
        <div className="chips">
          <span className={`chip tone-${color}`}>{label}</span>
          {item.grade && <span className="chip">{t('gradeN', { n: item.grade })}</span>}
        </div>
        <h3 className="item-title">{title}</h3>
        {desc && <p className="item-desc muted">{desc}</p>}
        <div className="item-meta muted small">
          {topic && <span className="truncate">{localized(topic, 'title', lang)}</span>}
          <span className="nowrap">
            <Calendar size={13} /> {formatDate(item.published_at || item.created_at, lang)}
          </span>
        </div>
      </div>
    </Link>
  );
}
