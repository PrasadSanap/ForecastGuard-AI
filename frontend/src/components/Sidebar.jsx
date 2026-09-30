import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { NAV } from '../utils/nav.js';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useNow from '../hooks/useNow.js';
import { timeAgo } from '../utils/time.js';

const Dot = ({ ok }) => <span className={`h-2 w-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />;

export default function Sidebar({ open, onClose }) {
  const { health, overview } = useApp();
  const { user, logout } = useAuth();
  const now = useNow();
  const dbOk = health && health.database === 'connected';
  const mlOk = health && health.mlService === 'ok';

  return (
    <>
      {open && <div className="fixed inset-0 z-[1900] bg-black/60 lg:hidden" onClick={onClose} />}
      <aside className={`border-line bg-panel fixed inset-y-0 left-0 z-[2000] flex w-64 flex-col border-r transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4">
          <Logo />
          <button className="lg:hidden" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {NAV.map(({ path, label, icon: Icon, enabled }) => enabled ? (
            <NavLink key={path} to={path} end={path === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-accent/15 text-accent' : 'text-slate-300 hover:bg-white/5'}`}>
              <Icon size={16} /> {label}
            </NavLink>
          ) : (
            <div key={path} title="Not available in this build" className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600">
              <Icon size={16} /> {label}
            </div>
          ))}
        </nav>

        <div className="border-line space-y-2 border-t p-3 text-xs">
          <div className="label">System status</div>
          <div className="flex items-center justify-between"><span className="text-slate-400">Database</span><Dot ok={dbOk} /></div>
          <div className="flex items-center justify-between"><span className="text-slate-400">ML service</span><Dot ok={mlOk} /></div>
          <div className="flex items-center justify-between"><span className="text-slate-400">Data mode</span><span className="text-amber-300">Demonstration</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-400">Last updated</span><span>{overview.data ? timeAgo(overview.data.lastUpdated, now) : '—'}</span></div>
          <div className="border-line flex items-center justify-between gap-2 border-t pt-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user && user.name}</div>
              <div className="text-[11px] text-slate-400">{user && user.role}</div>
            </div>
            <button className="btn px-2" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>
    </>
  );
}