import { useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import useApi from '../hooks/useApi.js';
import { useApp } from '../context/AppContext.jsx';
import { riskApi } from '../services/api.js';
import { METRICS } from '../utils/risk.js';
import IndiaRiskMap from '../map/IndiaRiskMap.jsx';
import HorizonChart from '../charts/HorizonChart.jsx';
import Panel from './Panel.jsx';
import DaySelector from './DaySelector.jsx';
import Timeline from './Timeline.jsx';
import AttentionList from './AttentionList.jsx';
import RegionDetailPanel from './RegionDetailPanel.jsx';
import { LabelTag } from './Badges.jsx';
import { EmptyState, ErrorState, Skeleton } from './States.jsx';

/** Shared by the Bust Radar and Confidence Map pages. */
export default function RiskMapView({ title, subtitle, defaultMetric = 'bust' }) {
  const { day, setDay, region, setRegion } = useApp();
  const [metric, setMetric] = useState(defaultMetric);

  const list = useApi(() => riskApi.list({ day }), [day]);
  const detail = useApi(() => (region ? riskApi.region(region, { day }) : Promise.resolve(null)), [region, day]);
  const items = (list.data && list.data.items) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        <LabelTag>Model estimate</LabelTag>
      </div>

      <div className="glass flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-1" role="group" aria-label="Metric">
          {Object.entries(METRICS).map(([key, m]) => (
            <button key={key} onClick={() => setMetric(key)}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                metric === key ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-panel2 hover:border-accent/50 text-slate-300'}`}>
              {m.label}
            </button>
          ))}
        </div>
        <DaySelector value={day} onChange={setDay} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <div>
          {list.error ? <ErrorState message={list.error} onRetry={list.reload} />
            : list.loading && !list.data ? <Skeleton className="h-[560px]" />
              : <IndiaRiskMap items={items} metric={metric} selectedCode={region} onSelect={setRegion} height={560} />}
        </div>

        <div className="space-y-4">
          {region ? (
            <RegionDetailPanel detail={detail} onClose={() => setRegion(null)} />
          ) : (
            <Panel title={`Regions requiring attention · D${day}`} subtitle="Click a marker or a row to open details">
              {items.length ? <AttentionList items={items} metric={metric} onSelect={setRegion} />
                : <EmptyState title="No assessments for this day" hint="Run npm run seed in the backend." />}
            </Panel>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Forecast timeline" subtitle={region && detail.data ? `${detail.data.region.name} · click a day to switch` : undefined}>
          {region && detail.data ? <Timeline curve={detail.data.curve} day={day} onSelect={setDay} />
            : <EmptyState icon={MousePointerClick} title="Select a region on the map" hint="Its Day 1–10 risk timeline appears here." />}
        </Panel>
        <Panel title="Confidence decay curve" subtitle="Forecast confidence and bust probability by horizon (from the model)">
          {region && detail.data ? <HorizonChart data={detail.data.curve} selectedDay={day} height={220} />
            : <EmptyState icon={MousePointerClick} title="No region selected" hint="Choose a region to see how confidence decays from D1 to D10." />}
        </Panel>
      </div>
    </div>
  );
}