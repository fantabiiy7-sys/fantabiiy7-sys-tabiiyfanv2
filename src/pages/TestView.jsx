import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, RotateCcw, Download, Trophy, Pencil, Play } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useAsync, useTopics } from '../lib/hooks';
import { getItem } from '../lib/api';
import { downloadUrl, localized } from '../lib/utils';
import { EmptyState, ErrorBox, Spinner } from '../components/States';

export default function TestView() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { isAdmin } = useAuth();
  const { topics } = useTopics();
  const { data: test, loading, error, reload } = useAsync(() => getItem('tests', id), [id]);
  const [phase, setPhase] = useState('intro'); // intro | quiz | result
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = useMemo(() => (Array.isArray(test?.questions) ? test.questions.filter((q) => q?.question) : []), [test]);

  if (loading) return <Spinner />;
  if (error) return <div className="container page"><ErrorBox error={error} onRetry={reload} /></div>;
  if (!test) return <div className="container page"><EmptyState title={t('admin.notFound')} text=" " /></div>;

  const topic = topics.find((x) => x.id === test.topic_id);
  const n = questions.length;
  const correctCount = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);
  const pct = n ? Math.round((correctCount / n) * 100) : 0;

  const restart = () => {
    setAnswers({});
    setIdx(0);
    setPhase('quiz');
  };

  return (
    <div className="container page narrow">
      <Link to="/tests" className="back-link">
        <ArrowLeft size={16} /> {t('nav.test')}
      </Link>
      <div className="chips">
        <span className="chip tone-indigo">{t('nav.test')}</span>
        <span className="chip">{t('gradeN', { n: test.grade })}</span>
        {topic && <Link to={`/topic/${topic.id}`} className="chip">{localized(topic, 'title', lang)}</Link>}
        {test.status === 'draft' && <span className="chip tone-orange">{t('admin.draft')}</span>}
      </div>
      <h1 className="detail-title">{localized(test, 'title', lang)}</h1>

      {phase === 'intro' && (
        <div className="card quiz-card">
          {localized(test, 'description', lang) && <p className="pre-wrap">{localized(test, 'description', lang)}</p>}
          {n > 0 ? (
            <>
              <p className="muted">{t('test.questions', { n })}</p>
              <button className="btn btn-primary btn-lg" onClick={restart}>
                <Play size={18} /> {t('test.start')}
              </button>
            </>
          ) : (
            <p className="muted">{t('test.noQuestions')}</p>
          )}
          {test.file_path && (
            <a className="btn btn-outline" href={downloadUrl(test.file_path, test.file_name)}>
              <Download size={18} /> {t('test.attachment')}: {test.file_name}
            </a>
          )}
          {isAdmin && (
            <Link className="btn btn-soft" to={`/admin/tests/${test.id}`}>
              <Pencil size={16} /> {t('admin.edit')}
            </Link>
          )}
        </div>
      )}

      {phase === 'quiz' && n > 0 && (
        <div className="card quiz-card">
          <div className="quiz-progress">
            <span className="small muted">{t('test.question', { i: idx + 1, n })}</span>
            <div className="progress">
              <span style={{ width: `${((idx + 1) / n) * 100}%` }} />
            </div>
          </div>
          <h2 className="quiz-q pre-wrap">{questions[idx].question}</h2>
          <div className="quiz-options" role="radiogroup">
            {questions[idx].options.map((opt, oi) =>
              opt ? (
                <button
                  key={oi}
                  role="radio"
                  aria-checked={answers[idx] === oi}
                  className={`quiz-option ${answers[idx] === oi ? 'selected' : ''}`}
                  onClick={() => setAnswers((a) => ({ ...a, [idx]: oi }))}
                >
                  <span className="opt-letter">{String.fromCharCode(65 + oi)}</span>
                  <span>{opt}</span>
                </button>
              ) : null
            )}
          </div>
          <div className="quiz-nav">
            <button className="btn btn-ghost" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
              <ArrowLeft size={18} /> {t('test.prev')}
            </button>
            {idx < n - 1 ? (
              <button className="btn btn-primary" onClick={() => setIdx((i) => i + 1)}>
                {t('test.next')} <ArrowRight size={18} />
              </button>
            ) : (
              <button className="btn btn-success" onClick={() => setPhase('result')}>
                <CheckCircle2 size={18} /> {t('test.finish')}
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'result' && (
        <>
          <div className="card quiz-card result-card">
            <Trophy size={44} className={pct >= 85 ? 'text-green' : pct >= 60 ? 'text-blue' : 'text-orange'} />
            <h2>{t('test.result')}</h2>
            <div className="score-ring" style={{ '--p': pct }}>
              <span>{pct}%</span>
            </div>
            <p className="lead">{t('test.score', { c: correctCount, n })}</p>
            <p className="muted">{pct >= 85 ? t('test.excellent') : pct >= 60 ? t('test.good') : t('test.tryAgain')}</p>
            <button className="btn btn-primary" onClick={restart}>
              <RotateCcw size={18} /> {t('test.retry')}
            </button>
          </div>
          <h2 className="sub-title">{t('test.review')}</h2>
          <ol className="review-list">
            {questions.map((q, i) => {
              const ok = answers[i] === q.correct;
              return (
                <li key={i} className={`card review-item ${ok ? 'ok' : 'bad'}`}>
                  <div className="review-head">
                    {ok ? <CheckCircle2 className="text-green" size={20} /> : <XCircle className="text-red" size={20} />}
                    <strong className="pre-wrap">{i + 1}. {q.question}</strong>
                  </div>
                  <p className="small">
                    <span className="muted">{t('test.yourAnswer')}:</span>{' '}
                    {answers[i] !== undefined ? q.options[answers[i]] : <em className="muted">{t('test.unanswered')}</em>}
                  </p>
                  {!ok && (
                    <p className="small">
                      <span className="muted">{t('test.correctAnswer')}:</span> <strong>{q.options[q.correct]}</strong>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="small explanation">
                      <span className="muted">{t('test.explanation')}:</span> {q.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
