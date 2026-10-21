import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Pencil,
  Play,
  Clock,
  Flag,
  LayoutGrid,
  LogOut,
  ListChecks,
  GraduationCap,
  BookOpen,
  FileText,
  Info,
  MinusCircle,
  Percent,
  Check,
  X,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useAsync, useTopics } from '../lib/hooks';
import { getItem } from '../lib/api';
import { downloadUrl, localized } from '../lib/utils';
import { EmptyState, ErrorBox, Spinner } from '../components/States';
import { Modal, useConfirm } from '../components/ConfirmDialog';

function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export default function TestView() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { topics } = useTopics();
  const { data: test, loading, error, reload } = useAsync(() => getItem('tests', id), [id]);
  const [phase, setPhase] = useState('intro'); // intro | quiz | result
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  // Faqat interfeys uchun: belgilangan savollar, vaqt, xarita va oynalar holati
  const [flagged, setFlagged] = useState(() => new Set());
  const [startedAt, setStartedAt] = useState(0);
  const [finishedAt, setFinishedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [mapOpen, setMapOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all');
  const qRef = useRef(null);

  const questions = useMemo(() => (Array.isArray(test?.questions) ? test.questions.filter((q) => q?.question) : []), [test]);
  const n = questions.length;

  // Sekundomer — faqat test ishlanayotganda
  useEffect(() => {
    if (phase !== 'quiz') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Imtihon rejimida suzuvchi tugmalarni yashirish
  useEffect(() => {
    if (phase !== 'quiz') return;
    document.body.classList.add('exam-mode');
    return () => document.body.classList.remove('exam-mode');
  }, [phase]);

  // Savol almashganda — savol boshiga qaytish
  useEffect(() => {
    if (phase !== 'quiz') return;
    setMapOpen(false);
    const el = qRef.current;
    if (el && el.getBoundingClientRect().top < 80) {
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 140, behavior: 'smooth' });
    }
  }, [idx, phase]);

  // Klaviatura: A–H — variant, ← → — savollar
  useEffect(() => {
    if (phase !== 'quiz' || finishOpen || !n) return;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.querySelector('.modal-root')) return;
      if (e.key === 'ArrowRight' && idx < n - 1) setIdx((i) => i + 1);
      else if (e.key === 'ArrowLeft' && idx > 0) setIdx((i) => i - 1);
      else if (/^[a-h]$/i.test(e.key)) {
        const oi = e.key.toLowerCase().charCodeAt(0) - 97;
        if (questions[idx]?.options?.[oi]) setAnswers((a) => ({ ...a, [idx]: oi }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, finishOpen, n, idx, questions]);

  if (loading) return <Spinner />;
  if (error) return <div className="container page"><ErrorBox error={error} onRetry={reload} /></div>;
  if (!test) return <div className="container page"><EmptyState title={t('admin.notFound')} text=" " /></div>;

  const topic = topics.find((x) => x.id === test.topic_id);
  const title = localized(test, 'title', lang);
  const description = localized(test, 'description', lang);
  const correctCount = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);
  const pct = n ? Math.round((correctCount / n) * 100) : 0;
  const answeredCount = questions.reduce((s, _, i) => s + (answers[i] !== undefined ? 1 : 0), 0);
  const unansweredCount = n - answeredCount;
  const wrongCount = answeredCount - correctCount;
  const elapsed = startedAt ? ((phase === 'result' ? finishedAt : now) - startedAt) / 1000 : 0;

  const restart = () => {
    setAnswers({});
    setIdx(0);
    setFlagged(new Set());
    setReviewFilter('all');
    const ts = Date.now();
    setStartedAt(ts);
    setNow(ts);
    setFinishedAt(0);
    setPhase('quiz');
    window.scrollTo({ top: 0 });
  };

  const finish = () => {
    setFinishOpen(false);
    setFinishedAt(Date.now());
    setPhase('result');
    window.scrollTo({ top: 0 });
  };

  const toggleFlag = (i) =>
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const exit = async () => {
    const ok = await confirm({
      title: t('test.exitTitle'),
      text: t('test.exitText'),
      confirmLabel: t('test.exitConfirm'),
      cancelLabel: t('test.continue'),
    });
    if (ok) navigate('/tests');
  };

  /* ------------------------------ Kirish ------------------------------ */
  if (phase === 'intro') {
    return (
      <div className="container page exam-intro-page">
        <Link to="/tests" className="back-link">
          <ArrowLeft size={16} /> {t('test.backToList')}
        </Link>
        <div className="exam-intro">
          <div className="exam-intro-main">
            <div className="test-card-tags">
              <span className="tag tag-subject">{t('subject')}</span>
              <span className="tag">{t('gradeN', { n: test.grade })}</span>
              {test.status === 'draft' && <span className="tag tag-warn">{t('admin.draft')}</span>}
            </div>
            <h1 className="exam-intro-title">{title}</h1>
            {topic && (
              <Link to={`/topic/${topic.id}`} className="exam-intro-topic">
                <BookOpen size={16} /> {localized(topic, 'title', lang)}
              </Link>
            )}
            {description && <p className="exam-intro-desc pre-wrap">{description}</p>}

            <dl className="info-tiles">
              <div className="info-tile">
                <dt>
                  <ListChecks size={16} /> {t('test.infoQuestions')}
                </dt>
                <dd>{n || '—'}</dd>
              </div>
              <div className="info-tile">
                <dt>
                  <GraduationCap size={16} /> {t('grade')}
                </dt>
                <dd>{t('gradeN', { n: test.grade })}</dd>
              </div>
              <div className="info-tile">
                <dt>
                  <FileText size={16} /> {t('test.format')}
                </dt>
                <dd>{n ? t('test.formatOnline') : t('test.formatFile')}</dd>
              </div>
            </dl>
          </div>

          <aside className="exam-intro-side">
            {n > 0 ? (
              <>
                <h2 className="side-title">
                  <Info size={18} /> {t('test.rulesTitle')}
                </h2>
                <ul className="rules">
                  <li>{t('test.rule1')}</li>
                  <li>{t('test.rule2')}</li>
                  <li>{t('test.rule3')}</li>
                  <li className="hide-touch">{t('test.rule4')}</li>
                </ul>
                <button className="btn btn-primary btn-lg btn-block" onClick={restart}>
                  <Play size={18} /> {t('test.start')}
                </button>
              </>
            ) : (
              <div className="notice notice-info">
                <Info size={18} />
                <span>{t('test.noQuestions')}</span>
              </div>
            )}
            {test.file_path && (
              <a className="btn btn-outline btn-block" href={downloadUrl(test.file_path, test.file_name)}>
                <Download size={18} /> <span className="truncate">{t('test.attachment')}: {test.file_name}</span>
              </a>
            )}
            {isAdmin && (
              <Link className="btn btn-ghost btn-block" to={`/admin/tests/${test.id}`}>
                <Pencil size={16} /> {t('admin.edit')}
              </Link>
            )}
          </aside>
        </div>
      </div>
    );
  }

  /* ------------------------------ Test ishlash ------------------------------ */
  if (phase === 'quiz' && n > 0) {
    const q = questions[idx];
    const isFlagged = flagged.has(idx);
    const firstUnanswered = questions.findIndex((_, i) => answers[i] === undefined);

    const navigator = (
      <>
        <div className="map-head">
          <strong>{t('test.map')}</strong>
          <span className="muted small">{t('test.answeredN', { a: answeredCount, n })}</span>
        </div>
        <div className="progress-line" aria-hidden="true">
          <span style={{ width: `${(answeredCount / n) * 100}%` }} />
        </div>
        <div className="q-map">
          {questions.map((_, i) => {
            const answered = answers[i] !== undefined;
            const cls = [
              'q-cell',
              answered ? 'is-answered' : '',
              i === idx ? 'is-current' : '',
              flagged.has(i) ? 'is-flagged' : '',
            ].join(' ');
            const state = [
              answered ? t('test.legendAnswered') : t('test.legendUnanswered'),
              flagged.has(i) ? t('test.legendFlagged') : '',
            ]
              .filter(Boolean)
              .join(', ');
            return (
              <button
                key={i}
                type="button"
                className={cls}
                onClick={() => setIdx(i)}
                aria-label={`${i + 1}: ${state}`}
                aria-current={i === idx ? 'step' : undefined}
                title={state}
              >
                {i + 1}
                {flagged.has(i) && <Flag className="q-cell-flag" size={10} />}
              </button>
            );
          })}
        </div>
        <ul className="legend">
          <li>
            <span className="q-cell sample is-answered">1</span> {t('test.legendAnswered')}
          </li>
          <li>
            <span className="q-cell sample">1</span> {t('test.legendUnanswered')}
          </li>
          <li>
            <span className="q-cell sample is-current">1</span> {t('test.legendCurrent')}
          </li>
          <li>
            <span className="q-cell sample is-flagged">
              1<Flag className="q-cell-flag" size={10} />
            </span>{' '}
            {t('test.legendFlagged')}
          </li>
        </ul>
        <button type="button" className="btn btn-success btn-block" onClick={() => setFinishOpen(true)}>
          <Send size={17} /> {t('test.finishTest')}
        </button>
      </>
    );

    return (
      <div className="exam">
        <div className="exam-bar">
          <div className="container exam-bar-inner">
            <div className="exam-bar-title">
              <span className="exam-bar-sub">
                {t('subject')} · {t('gradeN', { n: test.grade })}
              </span>
              <strong className="truncate" title={title}>
                {title}
              </strong>
            </div>
            <div className="exam-timer" title={t('test.elapsed')} aria-label={`${t('test.elapsed')}: ${formatClock(elapsed)}`}>
              <Clock size={17} />
              <span className="exam-timer-value">{formatClock(elapsed)}</span>
            </div>
            <div className="exam-bar-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm map-toggle"
                onClick={() => setMapOpen((v) => !v)}
                aria-expanded={mapOpen}
              >
                <LayoutGrid size={16} /> {answeredCount}/{n}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={exit} title={t('test.exit')}>
                <LogOut size={16} /> <span className="hide-sm">{t('test.exit')}</span>
              </button>
              <button type="button" className="btn btn-success btn-sm hide-sm" onClick={() => setFinishOpen(true)}>
                <Send size={15} /> {t('test.finishTest')}
              </button>
            </div>
          </div>
          <div className="exam-bar-progress" aria-hidden="true">
            <span style={{ width: `${((idx + 1) / n) * 100}%` }} />
          </div>
        </div>

        <div className="container exam-body">
          <main className="exam-main">
            <section className="q-card" ref={qRef} aria-labelledby="q-text">
              <header className="q-card-head">
                <span className="q-counter">{t('test.question', { i: idx + 1, n })}</span>
                <button
                  type="button"
                  className={`flag-btn ${isFlagged ? 'active' : ''}`}
                  onClick={() => toggleFlag(idx)}
                  aria-pressed={isFlagged}
                >
                  <Flag size={15} /> {isFlagged ? t('test.unflag') : t('test.flag')}
                </button>
              </header>
              <h2 id="q-text" className="q-text rich-text">
                {q.question}
              </h2>
              <div className="answer-list" role="radiogroup" aria-labelledby="q-text">
                {q.options.map((opt, oi) =>
                  opt ? (
                    <button
                      key={oi}
                      type="button"
                      role="radio"
                      aria-checked={answers[idx] === oi}
                      className={`answer ${answers[idx] === oi ? 'selected' : ''}`}
                      onClick={() => setAnswers((a) => ({ ...a, [idx]: oi }))}
                    >
                      <span className="answer-letter">{String.fromCharCode(65 + oi)}</span>
                      <span className="answer-text rich-text">{opt}</span>
                      <span className="answer-check" aria-hidden="true">
                        <Check size={16} />
                      </span>
                    </button>
                  ) : null
                )}
              </div>
            </section>

            <nav className="exam-controls" aria-label={t('test.map')}>
              <button className="btn btn-outline" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
                <ArrowLeft size={18} /> <span className="ctl-label">{t('test.prev')}</span>
              </button>
              <button
                type="button"
                className={`btn btn-outline flag-ctl ${isFlagged ? 'active' : ''}`}
                onClick={() => toggleFlag(idx)}
                aria-pressed={isFlagged}
              >
                <Flag size={17} /> <span className="ctl-label">{isFlagged ? t('test.unflag') : t('test.flag')}</span>
              </button>
              {idx < n - 1 ? (
                <button className="btn btn-primary" onClick={() => setIdx((i) => i + 1)}>
                  <span className="ctl-label">{t('test.next')}</span> <ArrowRight size={18} />
                </button>
              ) : (
                <button className="btn btn-success" onClick={() => setFinishOpen(true)}>
                  <CheckCircle2 size={18} /> <span className="ctl-label">{t('test.finish')}</span>
                </button>
              )}
            </nav>
          </main>

          <aside className={`exam-side ${mapOpen ? 'open' : ''}`} aria-label={t('test.map')}>
            <div className="exam-side-inner">
              <button type="button" className="icon-btn sm sheet-close" onClick={() => setMapOpen(false)} aria-label="close">
                <X size={18} />
              </button>
              {navigator}
            </div>
          </aside>
          {mapOpen && <div className="sheet-backdrop" onClick={() => setMapOpen(false)} />}
        </div>

        <Modal
          open={finishOpen}
          onClose={() => setFinishOpen(false)}
          title={t('test.confirmTitle')}
          icon={unansweredCount ? AlertTriangle : CheckCircle2}
          tone={unansweredCount ? 'orange' : 'green'}
          footer={
            <>
              <button type="button" className="btn btn-outline" onClick={() => setFinishOpen(false)} data-autofocus>
                {t('test.continue')}
              </button>
              <button type="button" className="btn btn-success" onClick={finish}>
                <CheckCircle2 size={17} /> {t('test.confirmFinish')}
              </button>
            </>
          }
        >
          <div className="finish-summary">
            <div className="finish-row ok">
              <CheckCircle2 size={18} />
              <span>{t('test.answeredN', { a: answeredCount, n })}</span>
            </div>
            {unansweredCount > 0 ? (
              <button
                type="button"
                className="finish-row warn"
                onClick={() => {
                  setFinishOpen(false);
                  setIdx(firstUnanswered);
                }}
              >
                <MinusCircle size={18} />
                <span>{t('test.confirmUnanswered', { n: unansweredCount })}</span>
                <ArrowRight size={16} className="finish-go" />
              </button>
            ) : (
              <div className="finish-row ok">
                <Check size={18} />
                <span>{t('test.confirmAllAnswered')}</span>
              </div>
            )}
            {flagged.size > 0 && (
              <div className="finish-row flag">
                <Flag size={18} />
                <span>{t('test.confirmFlagged', { n: flagged.size })}</span>
              </div>
            )}
          </div>
          <p className="modal-note small">{t('test.confirmText')}</p>
        </Modal>
      </div>
    );
  }

  /* ------------------------------ Natija ------------------------------ */
  const tone = pct >= 85 ? 'green' : pct >= 60 ? 'blue' : 'orange';
  const R = 54;
  const C = 2 * Math.PI * R;
  const reviewItems = questions
    .map((q, i) => ({ q, i, ans: answers[i] }))
    .filter(({ q, ans }) => {
      if (reviewFilter === 'correct') return ans === q.correct;
      if (reviewFilter === 'wrong') return ans !== undefined && ans !== q.correct;
      if (reviewFilter === 'unanswered') return ans === undefined;
      return true;
    });
  const filterTabs = [
    { key: 'all', label: t('test.filterAll'), count: n },
    { key: 'correct', label: t('test.correct'), count: correctCount },
    { key: 'wrong', label: t('test.wrong'), count: wrongCount },
    { key: 'unanswered', label: t('test.unanswered'), count: unansweredCount },
  ];

  return (
    <div className="container page result-page">
      <Link to="/tests" className="back-link">
        <ArrowLeft size={16} /> {t('test.backToList')}
      </Link>

      <section className="result-hero">
        <div className={`score-dial tone-${tone}`} role="img" aria-label={`${pct}%`}>
          <svg viewBox="0 0 128 128" aria-hidden="true">
            <circle className="dial-track" cx="64" cy="64" r={R} />
            <circle
              className="dial-value"
              cx="64"
              cy="64"
              r={R}
              strokeDasharray={C}
              strokeDashoffset={C - (C * pct) / 100}
            />
          </svg>
          <div className="dial-label">
            <strong>{pct}%</strong>
            <span>
              {correctCount}/{n}
            </span>
          </div>
        </div>
        <div className="result-copy">
          <span className="eyebrow">{t('test.finalScore')}</span>
          <h1 className="result-title">{title}</h1>
          <p className="result-score">{t('test.score', { c: correctCount, n })}</p>
          <span className={`result-status tone-${tone}`}>
            {pct >= 85 ? t('test.excellent') : pct >= 60 ? t('test.good') : t('test.tryAgain')}
          </span>
          <div className="result-actions">
            <button className="btn btn-primary" onClick={restart}>
              <RotateCcw size={18} /> {t('test.retry')}
            </button>
            <Link to="/tests" className="btn btn-outline">
              {t('test.backToList')}
            </Link>
          </div>
        </div>
      </section>

      <section className="result-stats">
        <div className="r-stat is-correct">
          <CheckCircle2 size={20} />
          <strong>{correctCount}</strong>
          <span>{t('test.correctN')}</span>
        </div>
        <div className="r-stat is-wrong">
          <XCircle size={20} />
          <strong>{wrongCount}</strong>
          <span>{t('test.wrongN')}</span>
        </div>
        <div className="r-stat is-skip">
          <MinusCircle size={20} />
          <strong>{unansweredCount}</strong>
          <span>{t('test.unansweredN')}</span>
        </div>
        <div className="r-stat is-pct">
          <Percent size={20} />
          <strong>{pct}%</strong>
          <span>{t('test.percent')}</span>
        </div>
        <div className="r-stat is-time">
          <Clock size={20} />
          <strong>{formatClock(elapsed)}</strong>
          <span>{t('test.timeSpent')}</span>
        </div>
      </section>

      <div className="review-head-bar">
        <h2 className="sub-title">{t('test.review')}</h2>
        <div className="seg seg-sm" role="tablist">
          {filterTabs.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={reviewFilter === f.key}
              className={reviewFilter === f.key ? 'active' : ''}
              onClick={() => setReviewFilter(f.key)}
            >
              {f.label} <span className="seg-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {reviewItems.length === 0 ? (
        <div className="empty compact">
          <p className="muted">{t('test.noReviewItems')}</p>
        </div>
      ) : (
        <ol className="review">
          {reviewItems.map(({ q, i, ans }) => {
            const status = ans === undefined ? 'skip' : ans === q.correct ? 'ok' : 'bad';
            return (
              <li key={i} className={`review-card is-${status}`}>
                <div className="review-card-head">
                  <span className="review-num">{i + 1}</span>
                  <p className="review-q rich-text">{q.question}</p>
                  <span className={`review-badge is-${status}`}>
                    {status === 'ok' ? <CheckCircle2 size={15} /> : status === 'bad' ? <XCircle size={15} /> : <MinusCircle size={15} />}
                    {status === 'ok' ? t('test.correct') : status === 'bad' ? t('test.wrong') : t('test.unanswered')}
                  </span>
                </div>
                <ul className="review-options">
                  {q.options.map((opt, oi) => {
                    if (!opt) return null;
                    const isCorrect = oi === q.correct;
                    const isChosen = oi === ans;
                    const cls = isCorrect ? 'is-correct' : isChosen ? 'is-chosen-wrong' : '';
                    return (
                      <li key={oi} className={`review-opt ${cls}`}>
                        <span className="answer-letter">{String.fromCharCode(65 + oi)}</span>
                        <span className="rich-text">{opt}</span>
                        <span className="review-opt-tags">
                          {isChosen && <em>{t('test.yourAnswer')}</em>}
                          {isCorrect && <Check size={16} aria-label={t('test.correctAnswer')} />}
                          {isChosen && !isCorrect && <X size={16} aria-hidden="true" />}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {q.explanation && (
                  <div className="review-expl">
                    <Info size={16} />
                    <p>
                      <strong>{t('test.explanation')}:</strong> {q.explanation}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
