import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Database, Layers, MapPin, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import useApi from '../hooks/useApi.js';
import useNow from '../hooks/useNow.js';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { riskApi } from '../services/api.js';
import { timeAgo } from '../utils/time.js';
import { riskColor } from '../utils/risk.js';
import KpiCard from '../components/KpiCard.jsx';
import Panel from '../components/Panel.jsx';
import DaySelector from '../components/DaySelector.jsx';
import { LabelTag, RiskBadge } from '../components/Badges.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/States.jsx';
import IndiaRiskMap from '../map/IndiaRiskMap.jsx';
import HorizonChart from '../charts/HorizonChart.jsx';

export default function Overview() {
  const { overview, day, setDay, setRegion, regions } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const now = useNow();
  const risks = useApi(() => riskApi.list({ day }), [day]);
  const { data, loading, error } = overview;

  const openRegion = (code, d) => { setRegion(code); if (d) setDay(d); navigate('/bust-radar'); };
  const refresh = () => { overview.reload(); risks.reload(); toast('Data refreshed (demonstration data — not live NCMRWF data)', 'success'); };

  if (error) return <ErrorState message={error} onRetry={overview.reload} />;
  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const k = data.kpis;
  const sum = data.summary;

  return (
    <div className="space-y-4">
      <div className="glass flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold">Forecast Reliability Command Center</h2>
          <p className="mt-1 text-sm text-slate-400">AI-powered identification of forecast uncertainty and potential forecast busts.</p>
          <p className="border-accent/30 bg-accent/5 mt-3 rounded-lg border p-3 text-sm text-slate-300">
            <b className="text-accent">We are not predicting weather from scratch — we are predicting forecast reliability.</b>{' '}
            ForecastGuard AI analyzes forecast behavior, historical errors and atmospheric indicators to estimate where and when a
            medium-range forecast may become unreliable.
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <button className="btn mb-2" onClick={refresh}><RefreshCw size={14} /> Refresh</button>
          <div>Last updated: {timeAgo(data.lastUpdated, now)}</div>
          <div className="text-amber-300">DEMONSTRATION MODE</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Overall Forecast Confidence" value={k.overallConfidence} suffix="%" decimals={1} icon={ShieldCheck} tone="#22d3ee" hint="mean across regions and D1–D10" />
        <KpiCard label="Average Bust Probability" value={k.averageBustProbability} suffix="%" decimals={1} icon={AlertTriangle} tone="#f97316" hint="model estimate" />
        <KpiCard label="Regions Requiring Attention" value={k.regionsRequiringAttention} icon={MapPin} tone="#f59e0b" hint={`of ${regions.length} · max bust ≥ ${sum.thresholds.attention}%`} />
        <KpiCard label="High-Risk Forecast Windows" value={k.highRiskForecastWindows} icon={Layers} tone="#ef4444" hint="region × day cells rated HIGH/CRITICAL" />
        <KpiCard label="Data Coverage" value={k.dataCoverage} suffix="%" decimals={1} icon={Database} tone="#22c55e" hint="regions × horizons assessed" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`Forecast Bust Radar · D${day}`} subtitle="Click a region to open the full radar"
          right={<LabelTag>Model estimate</LabelTag>}>
          <div className="mb-3"><DaySelector value={day} onChange={setDay} /></div>
          {risks.error ? <ErrorState message={risks.error} onRetry={risks.reload} />
            : <IndiaRiskMap items={(risks.data && risks.data.items) || []} metric="bust" onSelect={(c) => openRegion(c)} height={400} />}
        </Panel>

        <div className="space-y-4">
          <Panel title="Forecast confidence trend · Day 1 → Day 10" subtitle="Average across assessed regions" right={<LabelTag>Model estimate</LabelTag>}>
            <HorizonChart data={data.trend} selectedDay={day} height={230} />
          </Panel>
          <Panel title="AI insight" right={<LabelTag>Model estimate</LabelTag>}>
            <div className="flex gap-3 text-sm text-slate-300"><Sparkles className="text-accent mt-0.5 shrink-0" size={18} />{data.insight}</div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="High-risk regions" subtitle="Worst forecast day per region">
          {data.highRiskRegions.length === 0 ? <EmptyState title="No regions above the attention threshold" /> : (
            <ul className="divide-line divide-y">
              {data.highRiskRegions.map((r) => (
                <li key={r.region.id}>
                  <button onClick={() => openRegion(r.region.code, r.worstDay)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-white/5">
                    <div>
                      <div className="text-sm font-medium">{r.region.name}</div>
                      <div className="text-xs text-slate-400">D{r.worstDay} · {r.primaryDriver}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums" style={{ color: riskColor(r.riskLevel) }}>{r.maxBustProbability}%</span>
                      <RiskBadge level={r.riskLevel} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Today's forecast reliability summary" right={<LabelTag>Model estimate</LabelTag>}>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="label mb-2">Stable regions ({sum.stableRegions.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {sum.stableRegions.length ? sum.stableRegions.map((n) => (
                  <span key={n} className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[11px] text-green-300">{n}</span>
                )) : <span className="text-xs text-slate-500">None below {sum.thresholds.stable}% max bust</span>}
              </div>
            </div>
            <div>
              <div className="label mb-2">Requiring attention ({sum.regionsRequiringAttention.length})</div>
              <ul className="space-y-1 text-xs text-slate-300">
                {sum.regionsRequiringAttention.slice(0, 6).map((r) => (
                  <li key={r.name} className="flex justify-between"><span>{r.name} · D{r.day}</span><span className="tabular-nums text-orange-300">{r.bustProbability}%</span></li>
                ))}
                {!sum.regionsRequiringAttention.length && <li className="text-slate-500">None</li>}
              </ul>
            </div>
            <div>
              <div className="label mb-2">Weather-system indicators</div>
              <ul className="space-y-1 text-xs text-slate-300">
                {sum.weatherSystemIndicators.slice(0, 6).map((e) => (
                  <li key={e.event} className="flex justify-between" title={e.regions.join(', ')}><span>{e.event}</span><span className="tabular-nums text-amber-300">{e.count} region(s)</span></li>
                ))}
                {!sum.weatherSystemIndicators.length && <li className="text-slate-500">No indicators triggered</li>}
              </ul>
              <div className="mt-2"><LabelTag tone="#f59e0b">Prototype Event Detection</LabelTag></div>
            </div>
          </div>
        </Panel>
      </div>

      <p className="text-center text-[11px] text-slate-500">{data.disclaimer}</p>
    </div>
  );
}