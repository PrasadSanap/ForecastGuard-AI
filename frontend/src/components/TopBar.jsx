import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, Menu, Search } from 'lucide-react';
import { ModeBadge } from './Badges.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { NAV } from '../utils/nav.js';
import { fmtDate } from '../utils/time.js';

export default function TopBar({ title, onMenu }) {
  const { regions, region, setRegion, day, setDay, overview, activeAlerts } = useApp();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const alertsEnabled = NAV.find((n) => n.path === '/alerts').enabled;

  const search = (e) => {
    if (e.key !== 'Enter' || !query.trim()) return;
    const q = query.trim().toLowerCase();
    const hit = regions.find((r) => r.name.toLowerCase() === q) || regions.find((r) => r.name.toLowerCase().includes(q));
    if (!hit) return toast(`No region matches "${query}"`, 'error');
    setRegion(hit.code);
    navigate('/bust-radar');
    setQuery('');
  };

  const bell = (
    <span className="border-line bg-panel2 relative inline-flex rounded-lg border p-2 text-slate-300">
      <Bell size={16} />
      {activeAlerts > 0 && <span className="min-w-4 absolute -right-1 -top-1 grid h-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{activeAlerts}</span>}
    </span>
  );

  return (
    <header className="border-line bg-bg/85 sticky top-0 z-[1500] border-b backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
        <div className="flex items-center gap-3">
          <button className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
          <div className="hidden text-[11px] font-semibold uppercase tracking-widest text-slate-400 sm:block">
            <span className="text-accent">ForecastGuard AI</span> · Medium-Range Forecast Reliability
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeBadge />
          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
            <input className="input w-44 pl-8" list="region-list" placeholder="Search region ↵" value={query}
              onChange={(e) => setQuery(e.target.value)} onKeyDown={search} />
            <datalist id="region-list">{regions.map((r) => <option key={r.code} value={r.name} />)}</datalist>
          </div>
          {alertsEnabled ? <Link to="/alerts" title="Active alerts">{bell}</Link> : <span title={`${activeAlerts} active alert(s)`}>{bell}</span>}
          <div className="border-line bg-panel2 hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs sm:flex">
            <span className="bg-accent/20 text-accent grid h-5 w-5 place-items-center rounded-full font-bold">{user && user.name[0]}</span>
            {user && user.role}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3 lg:px-6">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select className="input" value={region || ''} onChange={(e) => setRegion(e.target.value || null)} aria-label="Region">
            <option value="">All regions</option>
            {regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
          </select>
          <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))} aria-label="Forecast day">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Day {d}</option>)}
          </select>
          <span className="border-line bg-panel2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-slate-300"
            title="Issue date of the stored assessment (read-only: one assessment date is stored)">
            <CalendarDays size={13} /> {overview.data ? fmtDate(overview.data.date) : '—'}
          </span>
        </div>
      </div>
    </header>
  );
}