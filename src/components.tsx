import type { PropsWithChildren, ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, Award, BarChart3, BookOpen, FileText, History, Library,
  GraduationCap, LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck,
  Target, TrendingUp, Users, Workflow, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Role, ScoreLevel } from './types';
import { scoreLevel } from './data';
import { currentLanguage, switchLanguage } from './i18n';
import { useAuth } from './auth';
import { useProduct } from './product-state';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="AVERIS by VulneraX">
      <AverisMark />
      {!compact && <span className="brand-lockup"><strong>AVERIS</strong><small>by VulneraX</small></span>}
    </div>
  );
}

export function AverisMark({ className = '' }: { className?: string }) {
  return <span className={`brand-mark ${className}`} aria-hidden="true"><svg viewBox="0 0 34 34" role="img"><path d="M7.3 25.3 15.7 7.8a1.45 1.45 0 0 1 2.63 0l3.18 6.62"/><path d="M11 18.5h8.15"/><path className="signal" d="M22.4 17.4h4.3M20.8 21.3h7.5M19.2 25.2h10.3"/></svg></span>;
}

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/employees', label: 'People', icon: Users },
  { to: '/admin/campaigns', label: 'Campaigns', icon: Target },
  { to: '/admin/learning', label: 'Learning', icon: GraduationCap },
  { to: '/admin/content', label: 'Content', icon: Library },
  { to: '/admin/automation', label: 'Automation', icon: Workflow },
  { to: '/admin/awareness', label: 'Awareness', icon: BarChart3 },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/audit', label: 'Audit Log', icon: History },
];

const employeeNav = [
  { to: '/employee', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/employee/learning', label: 'My Learning', icon: BookOpen },
  { to: '/employee/awareness', label: 'My Awareness', icon: BarChart3 },
  { to: '/employee/certificates', label: 'Certificates', icon: Award },
];

export function AppShell({ role, children }: PropsWithChildren<{ role: Role }>) {
  const navigate = useNavigate();
  const {user,logout}=useAuth();
  const {error,pending,clearError}=useProduct();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  const isAdmin=role!=='employee';
  const nav = isAdmin ? adminNav : employeeNav;
  const initials=user?.organization.name.split(' ').map(word=>word[0]).join('').slice(0,2).toUpperCase()??'AV';
  const roleName={super_admin:'Super Admin',admin:'Administrator',manager:'Manager',employee:'Employee'}[role];

  return (
    <div className={`app-shell ${isAdmin?'admin':'employee'}`}>
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
      {open && <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          <Brand />
          <button className="icon-button mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        {isAdmin && (
          <div className="org-switcher" aria-label="Current organization">
            <span className="org-logo">{initials}</span>
            <span><strong>{user?.organization.name}</strong><small>Tenant terisolasi</small></span>
          </div>
        )}
        <nav className="side-nav" aria-label={`${role} navigation`}>
          <span className="nav-label">Workspace</span>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {['super_admin','admin'].includes(role) && <>
            <button onClick={() => navigate('/admin/integrations')}><ShieldCheck size={18} /> Integrations</button>
            <button onClick={() => navigate('/admin/settings')}><Settings size={18} /> Settings</button>
          </>}
          <div className="profile-block">
            <Avatar name={user?.name??'User'} />
            <span><strong>{user?.name}</strong><small>{roleName}{user?.department?` · ${user.department}`:''}</small></span>
            <button onClick={() => void logout().then(()=>navigate('/'))} aria-label="Sign out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
      <main className="app-main">
        <header className="topbar">
          <div className="cycle-pill"><span className="status-dot" /> Q3 Security Awareness 2026</div>
          <div className="topbar-actions">
            <div className="language-switch" aria-label="Language selector">
              <button className={currentLanguage() === 'en' ? 'active' : ''} onClick={() => switchLanguage('en')}>EN</button>
              <button className={currentLanguage() === 'id' ? 'active' : ''} onClick={() => switchLanguage('id')}>ID</button>
            </div>
            <span className="secure-session"><ShieldCheck size={15}/>{pending?'Menyimpan...':roleName}</span>
            <Avatar name={user?.name??'User'} />
          </div>
        </header>
        <div className="page-wrap">
          {error&&<div className="global-error" role="alert"><AlertCircle size={18}/><span>{error}</span><button onClick={clearError} aria-label="Tutup pesan error"><X size={16}/></button></div>}
          {children}
        </div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, eyebrow, actions }: { title: string; subtitle?: string; eyebrow?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {actions && <div className="header-actions">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button ${variant} ${className}`} {...props}>{children}</button>;
}

export function BackButton({ label = 'Back' }: { label?: string }) {
  const navigate = useNavigate();
  return <button className="back-button" onClick={() => navigate(-1)}><ArrowLeft size={17} />{label}</button>;
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((word) => word[0]).join('').slice(0, 2);
  const palette = ['blue', 'violet', 'teal', 'amber'];
  const index = name.charCodeAt(0) % palette.length;
  return <span className={`avatar ${size} ${palette[index]}`}>{initials}</span>;
}

export function ScoreBadge({ score, label }: { score?: number; label?: ScoreLevel }) {
  const level = label ?? scoreLevel(score ?? 0);
  return <span className={`score-badge ${level.toLowerCase().replace(/ /g, '-')}`}><i />{level}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const className = status.toLowerCase().replace(/ /g, '-');
  return <span className={`status-badge ${className}`}>{status}</span>;
}

export function ProgressBar({ value, tone = 'blue', label }: { value: number; tone?: 'blue' | 'green' | 'amber' | 'red'; label?: string }) {
  return <div className="progress-wrap">{label && <div className="progress-label"><span>{label}</span><strong>{value}%</strong></div>}<div className="progress-track"><span className={tone} style={{ width: `${value}%` }} /></div></div>;
}

export function TopicBar({ name, score, note }: { name: string; score: number; note?: string }) {
  const level = scoreLevel(score);
  const tone = level === 'Strong' ? 'green' : level === 'Good' ? 'blue' : level === 'Needs Improvement' ? 'amber' : 'red';
  return (
    <div className="topic-row">
      <div className="topic-copy"><span>{name}{note && <small>{note}</small>}</span><strong>{score}<em>/100</em></strong></div>
      <ProgressBar value={score} tone={tone} />
      <ScoreBadge label={level} />
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search-box"><Search size={18} /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /><span className="sr-only">Search</span></label>;
}

export function InsightBanner({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  return <div className="insight-banner"><span className="insight-icon"><TrendingUp size={20} /></span><div>{children}</div>{action}</div>;
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 4200); return () => window.clearTimeout(timer); }, [onClose]);
  return <div className="toast" role="status"><span><ShieldCheck size={18} /></span><div><strong>Assignment successful</strong><p>{message}</p></div><button onClick={onClose} aria-label="Close"><X size={17} /></button></div>;
}

export function EmptyState({title,description,action}:{title:string;description:string;action?:ReactNode}){
  return <div className="clean-empty"><ShieldCheck size={25}/><div><strong>{title}</strong><p>{description}</p>{action}</div></div>;
}
