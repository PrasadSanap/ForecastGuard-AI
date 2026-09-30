import { Activity, CheckCircle2, Clock, Database, GitBranch, Layers } from 'lucide-react';
import useApi from '../hooks/useApi.js';
import { modelApi } from '../services/api.js';
import Panel from '../components/Panel.jsx';
import KpiCard from '../components/KpiCard.jsx';
import UploadBox from '../components/UploadBox.jsx';
import { ErrorState, Skeleton } from '../components/States.jsx';
import { fmtDate } from '../utils/time.js';

const TONE = { GOOD: '#22c55e', WARNING: '#f59e0b', CRITICAL: '#ef4444' };

export default function ModelHealth() {
  const health = useApi(() => modelApi.health(), []);
  const { data, loading, error, reload } = health;

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Model &amp; Data Health</h2><p className="text-sm text-slate-400">Engineering status of the reliability engine and its underlying data.</p></div>
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ color: TONE[data.status], background: `${TONE[data.status]}22`, border: `1px solid ${TONE[data.status]}55` }}>
          DATA QUALITY: {data.status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Model Version" value={undefined} icon={GitBranch} tone="#22d3ee" hint={data.model.version} />
        <KpiCard label="Training Samples" value={data.model.trainingSamples} icon={Database} tone="#22c55e" />
        <KpiCard label="Prediction Latency" value={data.service.predictionLatencyMs} suffix=" ms" icon={Activity} tone="#f59e0b" />
        <KpiCard label="Data Coverage" value={data.data.coveragePct} suffix="%" decimals={1} icon={Layers} tone="#84cc16" />
      </div>

      <Panel title="Checks">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.checks.map((c) => (
            <div key={c.name} className="rounded-lg border border-line bg-panel2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.name}</span>
                <CheckCircle2 size={16} style={{ color: TONE[c.status] }} />
              </div>
              <div className="mt-1 text-xs" style={{ color: TONE[c.status] }}>{c.status}</div>
              <div className="mt-1 text-xs text-slate-400">{c.detail}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Model">
          <dl className="space-y-2 text-sm">
            <Row k="Version" v={data.model.version} />
            <Row k="Last training" v={fmtDate(data.model.lastTraining)} icon={<Clock size={12} />} />
            <Row k="Training samples" v={data.model.trainingSamples} />
            {data.model.metrics && <>
              <Row k="Bust AUC (held-out)" v={data.model.metrics.aucBust} />
              <Row k="Normalised MAE (held-out)" v={data.model.metrics.maeNormalised} />
              <Row k="Bust rate in training data" v={`${Math.round(data.model.metrics.bustRate * 100)}%`} />
            </>}
            <Row k="Bust threshold (normalised)" v={data.model.bustThreshold} />
          </dl>
          <p className="mt-3 text-[11px] text-slate-500">{data.model.note}</p>
        </Panel>
        <Panel title="Data">
          <dl className="space-y-2 text-sm">
            <Row k="Missing data" v={`${data.data.missingPct}%`} />
            <Row k="Feature coverage" v={`${data.data.featureCoveragePct}% (${data.data.featuresAvailable.length}/7)`} />
            <Row k="Regions" v={data.data.counts.regions} />
            <Row k="Forecast records" v={data.data.counts.forecasts.toLocaleString()} />
            <Row k="Observation records" v={data.data.counts.observations.toLocaleString()} />
            <Row k="Error records" v={data.data.counts.errorRecords.toLocaleString()} />
            <Row k="Risk assessments" v={data.data.counts.riskRecords.toLocaleString()} />
          </dl>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.data.sources.map((s) => <span key={s.source} className="rounded-full border border-line bg-panel2 px-2 py-0.5 text-[11px] text-slate-300">{s.source}: {s.count.toLocaleString()}</span>)}
          </div>
        </Panel>
      </div>

      <Panel title="Upload Forecast Dataset" subtitle="Plug in an official NWP/observation dataset later using this same format">
        <UploadBox onDone={reload} />
      </Panel>
    </div>
  );
}

const Row = ({ k, v, icon }) => (
  <div className="flex items-center justify-between border-b border-line/50 pb-1.5"><dt className="flex items-center gap-1 text-slate-400">{icon}{k}</dt><dd className="font-medium">{v ?? '—'}</dd></div>
);