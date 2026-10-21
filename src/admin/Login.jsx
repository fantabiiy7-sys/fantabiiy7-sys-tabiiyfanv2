import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Mail, LogIn, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { isConfigured } from '../lib/supabase';
import { ConfigNotice } from '../components/States';
import { Logo, LangSwitcher, ThemeToggle } from '../components/Layout';

export default function Login() {
  const { t } = useI18n();
  const { signIn, isAdmin, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const next = params.get('next');
  const target = next && next.startsWith('/admin') ? next : '/admin';

  if (!loading && isAdmin) return <Navigate to={target} replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.code === 'not_admin' ? t('admin.notAdmin') : t('admin.badLogin'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-tools">
        <LangSwitcher />
        <ThemeToggle />
      </div>
      <form className="card login-card" onSubmit={submit}>
        <Logo />
        <div className="login-head">
          <span className="page-icon tone-blue">
            <ShieldCheck size={24} />
          </span>
          <h1>{t('admin.loginTitle')}</h1>
          <p className="muted small">{t('admin.loginText')}</p>
        </div>
        <ConfigNotice />
        <label className="field">
          <span className="field-label">{t('admin.email')}</span>
          <span className="input-icon">
            <Mail size={18} />
            <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </span>
        </label>
        <label className="field">
          <span className="field-label">{t('admin.password')}</span>
          <span className="input-icon">
            <Lock size={18} />
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </span>
        </label>
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary btn-block btn-lg" disabled={busy || !isConfigured}>
          <LogIn size={18} /> {busy ? t('loading') : t('admin.login')}
        </button>
        <Link to="/" className="back-link center">
          <ArrowLeft size={16} /> {t('nav.home')}
        </Link>
      </form>
    </div>
  );
}
