import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookMarked, Settings, LogOut, ExternalLink, Menu, X, Sparkles, ClipboardCheck } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { MATERIAL_TYPES } from '../lib/constants';
import { Logo, LangSwitcher, ThemeToggle } from '../components/Layout';

export default function AdminLayout() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);

  const links = [
    { to: '/admin', end: true, icon: LayoutDashboard, label: t('admin.dashboard') },
    ...Object.values(MATERIAL_TYPES).map((m) => ({
      to: `/admin/materials/${m.key}`,
      icon: m.icon,
      label: t(`nav.${m.key}`),
      color: m.color,
    })),
    { to: '/admin/animations', icon: Sparkles, label: t('nav.animation'), color: 'teal' },
    { to: '/admin/tests', icon: ClipboardCheck, label: t('nav.test'), color: 'indigo' },
    { to: '/admin/topics', icon: BookMarked, label: t('admin.topics') },
    { to: '/admin/settings', icon: Settings, label: t('admin.settings') },
  ];

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <Logo />
          <button className="icon-btn admin-close" onClick={() => setOpen(false)} aria-label="close">
            <X size={18} />
          </button>
        </div>
        <span className="admin-label">{t('admin.panel')}</span>
        <nav className="admin-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="admin-link">
              <l.icon size={18} />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-user">
          <small className="muted truncate">{user?.email}</small>
          <button
            className="btn btn-ghost btn-sm btn-block"
            onClick={async () => {
              await signOut();
              navigate('/admin/login');
            }}
          >
            <LogOut size={16} /> {t('admin.logout')}
          </button>
        </div>
      </aside>
      {open && <div className="admin-backdrop" onClick={() => setOpen(false)} />}
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="icon-btn admin-menu" onClick={() => setOpen(true)} aria-label="menu">
            <Menu size={20} />
          </button>
          <span className="spacer" />
          <LangSwitcher />
          <ThemeToggle />
          <Link to="/" className="btn btn-ghost btn-sm" target="_blank">
            <ExternalLink size={16} /> <span className="hide-sm">{t('admin.viewSite')}</span>
          </Link>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
