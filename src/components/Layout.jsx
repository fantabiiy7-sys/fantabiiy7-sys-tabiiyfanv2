import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Globe, ChevronDown, ShieldCheck, Leaf, Home, Info, Mail, Phone, Send } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSetting } from '../context/SettingsContext';
import { SECTIONS } from '../lib/constants';
import { LANGS } from '../i18n/translations';
import { ConfigNotice } from './States';
import { FeedbackFab, useTelegramLink } from './Feedback';

const MATERIAL_SECTIONS = SECTIONS.filter((s) => s.table === 'materials');
const OTHER_SECTIONS = SECTIONS.filter((s) => s.table !== 'materials');

export function Logo() {
  const { t } = useI18n();
  const setting = useSetting();
  return (
    <Link to="/" className="logo">
      <span className="logo-mark">
        <Leaf size={20} />
      </span>
      <span className="logo-text">
        <strong>{setting('siteName', t('subject'))}</strong>
        <small>5–6</small>
      </span>
    </Link>
  );
}

export function LangSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="lang-switch" title="Language">
      <Globe size={16} />
      <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
        {LANGS.map((l) => (
          <option key={l} value={l}>
            {t(`lang.${l}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const label = theme === 'dark' ? t('theme.light') : t('theme.dark');
  return (
    <button className="icon-btn" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function MaterialsDropdown() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const active = MATERIAL_SECTIONS.some((s) => location.pathname.startsWith(s.path)) || location.pathname.startsWith('/material/');

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button className={`nav-link ${active ? 'active' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {t('nav.materials')} <ChevronDown size={16} className={open ? 'rot' : ''} />
      </button>
      {open && (
        <div className="dropdown-menu">
          {MATERIAL_SECTIONS.map((s) => (
            <NavLink key={s.key} to={s.path} className="dropdown-item">
              <span className={`mini-icon tone-${s.color}`}>
                <s.icon size={18} />
              </span>
              <span>
                <strong>{t(`nav.${s.key}`)}</strong>
                <small className="muted">{t(`sectionDesc.${s.key}`)}</small>
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
  }, [mobileOpen]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="main-nav" aria-label="main">
          <NavLink to="/" end className="nav-link">
            {t('nav.home')}
          </NavLink>
          <MaterialsDropdown />
          {OTHER_SECTIONS.map((s) => (
            <NavLink key={s.key} to={s.path} className="nav-link">
              {t(`nav.${s.key}`)}
            </NavLink>
          ))}
          <NavLink to="/about" className="nav-link">
            {t('nav.about')}
          </NavLink>
        </nav>
        <div className="header-tools">
          <LangSwitcher />
          <ThemeToggle />
          {isAdmin && (
            <Link to="/admin" className="btn btn-soft btn-sm hide-sm">
              <ShieldCheck size={16} /> {t('nav.admin')}
            </Link>
          )}
          <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)} aria-label="menu">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="drawer-backdrop" onClick={() => setMobileOpen(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <Logo />
              <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label="close">
                <X size={20} />
              </button>
            </div>
            <nav className="drawer-nav">
              <NavLink to="/" end className="drawer-link">
                <Home size={18} /> {t('nav.home')}
              </NavLink>
              {SECTIONS.map((s) => (
                <NavLink key={s.key} to={s.path} className="drawer-link">
                  <span className={`mini-icon tone-${s.color}`}>
                    <s.icon size={16} />
                  </span>
                  {t(`nav.${s.key}`)}
                </NavLink>
              ))}
              <NavLink to="/about" className="drawer-link">
                <Info size={18} /> {t('nav.about')}
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="drawer-link">
                  <ShieldCheck size={18} /> {t('nav.admin')}
                </NavLink>
              )}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { t } = useI18n();
  const setting = useSetting();
  const year = new Date().getFullYear();
  const email = setting('contactEmail');
  const phone = setting('contactPhone');
  const telegram = useTelegramLink();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted small footer-about">{setting('footerText', t('tagline'))}</p>
          {setting('schoolName') && <p className="small">{setting('schoolName')}</p>}
        </div>
        <div>
          <h4>{t('footer.sections')}</h4>
          <ul className="footer-links">
            {SECTIONS.map((s) => (
              <li key={s.key}>
                <Link to={s.path}>{t(`nav.${s.key}`)}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{t('about.contact')}</h4>
          <ul className="footer-links">
            <li>
              <Link to="/about">{t('nav.about')}</Link>
            </li>
            {email && (
              <li>
                <a href={`mailto:${email}`}>
                  <Mail size={14} /> {email}
                </a>
              </li>
            )}
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/\s/g, '')}`}>
                  <Phone size={14} /> {phone}
                </a>
              </li>
            )}
            {telegram && (
              <li>
                <a href={telegram} target="_blank" rel="noreferrer">
                  <Send size={14} /> {t('feedback.title')}
                </a>
              </li>
            )}
            <li>
              <Link to="/admin">{t('nav.admin')}</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom muted small">
        © {year} {setting('siteName', t('subject'))}. {t('footer.rights')}
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <div className="app-shell">
      <Header />
      <main className="site-main">
        <div className="container">
          <ConfigNotice />
        </div>
        <Outlet />
      </main>
      <Footer />
      <FeedbackFab />
    </div>
  );
}
