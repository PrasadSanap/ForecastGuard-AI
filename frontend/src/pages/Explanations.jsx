import useApi from '../hooks/useApi.js';
import { useApp } from '../context/AppContext.jsx';
import { riskApi } from '../services/api.js';
import Panel from '../components/Panel.jsx';
import ContributionBars from '../components/ContributionBars.jsx';
import { LabelTag, RiskBadge } from '../components/Badges.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/States.jsx';

function summaryText(detail) {
  if (!detail) return '';
  const top = detail.selected.contributors.filter((c) => c.key !== 'horizon').slice(0, 3).map((c) => c.feature.toLowerCase());
  const list = top.length > 1 ? `${top.slice(0, -1).join(', ')} and ${top[top.length - 1]}` : top[0] || 'multiple factors';
  return `The model identifies elevated forecast uncertainty primarily due to ${list} for this forecast horizon (D${detail.selectedDay}).`;
}

export default function Explanations() {
  const { day, setDay, region, setRegion, regions } = useApp();
  const activeRegion = region || (regions[0] && regions[0].code);
  const detail = useApi(() => (activeRegion ? riskApi.region(activeRegion, { day }) : Promise.resolve(null)), [activeRegion, day]);

  if (!activeRegion) return <EmptyState title="No regions available" hint="Run the backend seed script." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Explainable Forecast Reliability</h2><p className="text-sm text-slate-400">Select a region and day to see why the model flags a forecast as uncertain.</p></div>
        <LabelTag>Model-generated explanation</LabelTag>
      </div>

      <div className="glass flex flex-wrap items-center gap-3 p-3">
        <select className="input" value={activeRegion} onChange={(e) => setRegion(e.target.value)}>{regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select>
        <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Day {d}</option>)}</select>
      </div>

      {detail.error && <ErrorState message={detail.error} onRetry={detail.reload} />}
      {!detail.error && (detail.loading || !detail.data) && <Skeleton className="h-96" />}

      {!detail.error && detail.data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={`${detail.data.region.name} · D${detail.data.selectedDay}`} right={<RiskBadge level={detail.data.selected.riskLevel} />}>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-panel2 p-3"><div className="label">Bust probability</div><div className="text-2xl font-semibold text-orange-400">{detail.data.selected.bustProbability}%</div></div>
              <div className="rounded-lg border border-line bg-panel2 p-3"><div className="label">Confidence</div><div className="text-2xl font-semibold text-cyan-400">{detail.data.selected.confidence}%</div></div>
            </div>
            <h4 className="mb-2 text-sm font-semibold">Why is this forecast at risk?</h4>
            <ContributionBars contributors={detail.data.selected.contributors} limit={8} />
          </Panel>
          <Panel title="AI Summary" subtitle="Model-generated explanation">
            <p className="text-sm leading-relaxed text-slate-300">{summaryText(detail.data)}</p>
            {detail.data.events.length > 0 && (
              <div className="mt-4">
                <div className="label mb-1.5">Related event indicators</div>
                <div className="flex flex-wrap gap-1.5">{detail.data.events.map((e) => <span key={e.event} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">{e.event}</span>)}</div>
              </div>
            )}
            <p className="mt-4 text-[11px] text-slate-500">Method: importance-weighted feature deviation from the ML reliability engine (not SHAP). Explanations describe model behavior on demonstration data and do not represent an official NCMRWF assessment.</p>
          </Panel>
        </div>
      )}
    </div>
  );
}