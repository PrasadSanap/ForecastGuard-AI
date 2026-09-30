import { useState } from 'react';
import { CheckCheck, MapPin } from 'lucide-react';
import useApi from '../hooks/useApi.js';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { alertApi, errMsg } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import Panel from '../components/Panel.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/States.jsx';
import { fmtDate } from '../utils/time.js';

const SEV = { Critical: '#ef4444', High: '#f97316', Moderate: '#f59e0b', Low: '#22c55e' };

export default function Alerts() {
  const { setRegion } = useApp();
  const { user } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('Active');
  const list = useApi(() => alertApi.list(status === 'All' ? {} : { status }), [status]);
  const canAct = user && ['Analyst', 'Admin'].includes(user.role);

  const act = async (id, next) => {
    try { await alertApi.update(id, next); toast(`Alert ${next.toLowerCase()}`, 'success'); list.reload(); }
    catch (e) { toast(errMsg(e), 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Alert Center</h2><p className="text-sm text-slate-400">Forecast-reliability alerts. Not emergency or warning instructions.</p></div>
      </div>

      {list.data && (
        <div className="grid grid-cols-5 gap-2">
          {['Critical', 'High', 'Moderate', 'Low', 'Resolved'].map((s) => (
            <div key={s} className="glass p-3 text-center">
              <div className="text-xl font-semibold" style={{ color: SEV[s] || '#94a3b8' }}>{list.data.counts[s]}</div>
              <div className="label">{s}</div>
            </div>
          ))}
        </div>
      )}

      <div className="glass flex gap-2 p-3">
        {['Active', 'Acknowledged', 'Resolved', 'All'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-md border px-3 py-1 text-xs font-medium ${status === s ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-panel2 text-slate-300'}`}>{s}</button>
        ))}
      </div>

      {list.error ? <ErrorState message={list.error} onRetry={list.reload} />
        : list.loading && !list.data ? <Skeleton className="h-64" />
          : !list.data.items.length ? <Panel><EmptyState title="No alerts in this view" /></Panel>
            : (
              <div className="space-y-3">
                {list.data.items.map((a) => (
                  <div key={a.id} className="glass p-4" style={{ borderLeft: `3px solid ${SEV[a.severity]}` }}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: SEV[a.severity] }}>
                          <span className="uppercase tracking-wide">{a.severity} FORECAST UNCERTAINTY</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-200">{a.region.name} · D{a.horizon} · {fmtDate(a.date)}</div>
                        <div className="mt-1 text-xs text-slate-400">Bust probability: <b className="text-slate-200">{a.bustProbability}%</b></div>
                        <div className="mt-1 text-xs text-slate-400">Reason: {a.reason}</div>
                        <div className="mt-1 text-xs text-slate-500">Recommended action: {a.recommendedAction}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full border border-line bg-panel2 px-2 py-0.5 text-[11px]">{a.status}</span>
                        <div className="flex gap-2">
                          <button className="btn px-2 py-1 text-xs" onClick={() => setRegion(a.region.code)}><MapPin size={12} /> View Analysis</button>
                          {canAct && a.status !== 'Resolved' && (
                            <button className="btn px-2 py-1 text-xs" onClick={() => act(a.id, a.status === 'Active' ? 'Acknowledged' : 'Resolved')}>
                              <CheckCheck size={12} /> {a.status === 'Active' ? 'Acknowledge' : 'Resolve'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
    </div>
  );
}