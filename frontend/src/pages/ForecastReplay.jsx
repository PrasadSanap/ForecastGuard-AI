import { useState } from 'react';
import useApi from '../hooks/useApi.js';
import { useApp } from '../context/AppContext.jsx';
import { forecastApi } from '../services/api.js';
import Panel from '../components/Panel.jsx';
import { LabelTag } from '../components/Badges.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/States.jsx';
import ReplayChart from '../charts/ReplayChart.jsx';

const VARIABLES = ['rainfall', 'temperature', 'windSpeed', 'pressure', 'humidity'];

export default function ForecastReplay() {
  const { region, regions, setRegion } = useApp();
  const [variable, setVariable] = useState('rainfall');
  const [horizon, setHorizon] = useState(3);
  const [date, setDate] = useState(null);

  const activeRegion = region || (regions[0] && regions[0].code);
  const replay = useApi(
    () => (activeRegion ? forecastApi.replay(activeRegion, { variable, horizon, date: date || undefined }) : Promise.resolve(null)),
    [activeRegion, variable, horizon, date],
  );

  if (!activeRegion) return <EmptyState title="No regions available" hint="Run the backend seed script." />;

  const data = replay.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Forecast Replay</h2>
          <p className="text-sm text-slate-400">Where did the forecast diverge?</p>
        </div>
        <LabelTag>{data ? data.label : 'Loading'}</LabelTag>
      </div>

      <div className="glass flex flex-wrap items-center gap-3 p-3">
        <select className="input" value={activeRegion} onChange={(e) => setRegion(e.target.value)}>
          {regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
        </select>
        <select className="input" value={variable} onChange={(e) => setVariable(e.target.value)}>
          {VARIABLES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className="input" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>Horizon D{h}</option>)}
        </select>
        {data && (
          <select className="input" value={date || data.selectedDate} onChange={(e) => setDate(e.target.value)}>
            {data.availableDates.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {replay.error && <ErrorState message={replay.error} onRetry={replay.reload} />}
      {!replay.error && (replay.loading || !data) && <Skeleton className="h-96" />}

      {!replay.error && data && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Stat label="MAE" value={data.stats.series.mae} unit={data.unit} />
            <Stat label="RMSE" value={data.stats.series.rmse} unit={data.unit} />
            <Stat label="Historical bust frequency" value={data.stats.series.bustFrequency} unit="%" />
          </div>

          <Panel title={`Forecast vs Observation · ${data.variable} · D${data.horizon}`} subtitle="Across the most recent dates for this horizon" right={<LabelTag>{data.unit}</LabelTag>}>
            {data.series.length ? <ReplayChart data={data.series} xKey="date" unit={data.unit} /> : <EmptyState title="No history for this selection" />}
          </Panel>

          <Panel title={`Error growth by horizon · ${data.selectedDate}`} subtitle="Same forecast date across D1–D10 — how error grows with lead time">
            {data.horizonProfile.length ? <ReplayChart data={data.horizonProfile} xKey="horizon" unit={data.unit} /> : <EmptyState title="No horizon profile for this date" />}
          </Panel>

          <Panel title="Deviation rule">
            <p className="text-sm text-slate-300">
              A point is flagged (red marker) when the absolute error reaches{' '}
              <b>{data.deviationRule.absoluteThreshold} {data.unit}</b> ({data.deviationRule.threshold}× the variable's typical variability).
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Data sources in this view: {data.dataSources.join(', ')}.</p>
          </Panel>
        </>
      )}
    </div>
  );
}

const Stat = ({ label, value, unit }) => (
  <div className="glass p-4"><div className="label">{label}</div><div className="mt-1 text-2xl font-semibold tabular-nums">{value === null ? '—' : value} <span className="text-sm text-slate-400">{unit}</span></div></div>
);