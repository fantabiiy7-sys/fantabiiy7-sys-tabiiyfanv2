import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, BookOpenCheck, GraduationCap } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useSetting } from '../context/SettingsContext';
import { useAsync, useTopics } from '../lib/hooks';
import { countPublished, listItems } from '../lib/api';
import { SECTIONS, GRADES } from '../lib/constants';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/States';

export default function Home() {
  const { t } = useI18n();
  const setting = useSetting();
  const { topics } = useTopics();
  const counts = useAsync(() => countPublished(), []);
  const latest = useAsync(() => listItems('materials', { status: 'published', limit: 6 }), []);
  const c = counts.data || {};

  return (
    <>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
        </div>
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="badge">
              <Sparkles size={14} /> {t('home.heroBadge')}
            </span>
            <h1>{setting('heroTitle', t('home.heroTitle'))}</h1>
            <p className="lead">{setting('heroText', t('home.heroText'))}</p>
            <div className="hero-actions">
              <Link to="/lesson-plans" className="btn btn-primary btn-lg">
                {t('home.explore')} <ArrowRight size={18} />
              </Link>
              <Link to="/animations" className="btn btn-outline btn-lg">
                <Sparkles size={18} /> {t('home.animations')}
              </Link>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <HeroIllustration />
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>{t('home.sections')}</h2>
          <p className="muted">{t('home.sectionsText')}</p>
        </div>
        <div className="grid sections-grid">
          {SECTIONS.map((s) => (
            <Link key={s.key} to={s.path} className="card section-card">
              <span className={`section-icon tone-${s.color}`}>
                <s.icon size={26} />
              </span>
              <h3>{t(`nav.${s.key}`)}</h3>
              <p className="muted small">{t(`sectionDesc.${s.key}`)}</p>
              <span className="section-count small">
                {counts.loading ? '…' : c[s.key] ? t('home.materialsCount', { n: c[s.key] }) : t('home.noMaterialsYet')}
                <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>{t('home.byGrade')}</h2>
        </div>
        <div className="grid grades-grid">
          {GRADES.map((g) => {
            const n = topics.filter((x) => x.grade === g).length;
            return (
              <Link key={g} to={`/grade/${g}`} className={`card grade-card grade-${g}`}>
                <span className="grade-num">{g}</span>
                <div>
                  <h3>{t('gradeN', { n: g })}</h3>
                  <p className="muted small">{t('home.gradeText', { n: g })}</p>
                  <span className="chip">
                    <GraduationCap size={14} /> {t('home.topicsCount', { n })}
                  </span>
                </div>
                <ArrowRight className="grade-arrow" size={22} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>{t('home.latest')}</h2>
        </div>
        {latest.loading ? null : latest.data?.length ? (
          <div className="grid cards-grid">
            {latest.data.map((item) => (
              <ItemCard key={item.id} item={item} topics={topics} />
            ))}
          </div>
        ) : (
          <EmptyState icon={BookOpenCheck} addTo="/admin" />
        )}
      </section>
    </>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 340" className="hero-svg">
      <defs>
        <linearGradient id="hg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--blue-400)" />
          <stop offset="1" stopColor="var(--green-400)" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="170" r="120" fill="url(#hg1)" opacity=".16" />
      <g className="orbit">
        <ellipse cx="200" cy="170" rx="150" ry="52" fill="none" stroke="var(--blue-400)" strokeWidth="2" strokeDasharray="5 8" opacity=".6" />
        <circle cx="350" cy="170" r="10" fill="var(--blue-500)" />
      </g>
      <g className="orbit orbit2">
        <ellipse cx="200" cy="170" rx="52" ry="150" fill="none" stroke="var(--green-400)" strokeWidth="2" strokeDasharray="5 8" opacity=".6" />
        <circle cx="200" cy="20" r="8" fill="var(--green-500)" />
      </g>
      <circle cx="200" cy="170" r="62" fill="var(--surface)" stroke="url(#hg1)" strokeWidth="4" />
      <path d="M200 125c-22 20-34 38-34 54a34 34 0 0 0 68 0c0-16-12-34-34-54z" fill="var(--green-500)" />
      <path d="M200 150v56M200 182l-13-11M200 172l13-11" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <g className="float f1">
        <rect x="40" y="40" width="64" height="64" rx="18" fill="var(--surface)" stroke="var(--border)" />
        <circle cx="72" cy="72" r="14" fill="none" stroke="var(--blue-500)" strokeWidth="4" />
        <circle cx="72" cy="72" r="4" fill="var(--blue-500)" />
      </g>
      <g className="float f2">
        <rect x="300" y="250" width="64" height="64" rx="18" fill="var(--surface)" stroke="var(--border)" />
        <path d="M322 268h20M326 268v14l-8 16h28l-8-16v-14" stroke="var(--green-600)" strokeWidth="4" fill="none" strokeLinejoin="round" />
      </g>
      <g className="float f3">
        <rect x="36" y="240" width="64" height="64" rx="18" fill="var(--surface)" stroke="var(--border)" />
        <path d="M56 286l12-28 12 28M60 278h16" stroke="var(--orange-500)" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
