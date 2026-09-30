import { useState } from 'react';
import useApi from '../hooks/useApi.js';
import { useApp } from '../context/AppContext.jsx';
import { riskApi } from '../services/api.js';
import { sortByAttention } from '../utils/risk.js';
import Panel from '../components/Panel.jsx';
import DataTable from '../components/DataTable.jsx';
import { LabelTag, RiskBadge } from '../components/Badges.jsx';
import { ErrorState, Skeleton } from '../components/States.jsx';
import RegionDetailPanel from '../components/RegionDetailPanel.jsx';
import HorizonChart from '../charts/HorizonChart.jsx';
import ContributionBars from '../components/ContributionBars.jsx';

export default function RegionalAnalysis() {
  const { day, setDay, region, setRegion } = useApp();
  const [sort, setSort] = useState('bustProbability');
  const list = useApi(() => riskApi.list({ day, sort }), [day, sort]);
  const detail = useApi(() => (region ? riskApi.region(region, { day }) : Promise.resolve(null)), [region, day]);
  const items = sortByAttention(sort === 'confidence' ? 'confidence' : sort === 'expectedError' ? 'error' : 'bust', (list.data && list.data.items) || []);

  const columns = [
    { key: 'region', label: 'Region', render: (r) => r.region.name },
    { key: 'day', label: 'Day', render: (r) => `D${r.horizon}` },
    { key: 'confidence', label: 'Confidence', render: (r) => `${r.confidence}%` },
    { key: 'bustProbability', label: 'Bust probability', render: (r) => `${r.bustProbability}%` },
    { key: 'expectedError', label: 'Expected error', render: (r) => r.expectedErrorLevel },
    { key: 'primaryDriver', label: 'Primary driver' },
    { key: 'status', label: 'Status', render: (r) => <RiskBadge level={r.riskLevel} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Regional Analysis</h2><p className="text-sm text-slate-400">Regions Requiring Attention — sortable by bust probability, error or confidence.</p></div>
        <LabelTag>Model estimate</LabelTag>
      </div>

      <div className="glass flex flex-wrap items-center gap-3 p-3">
        <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Day {d}</option>)}</select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="bustProbability">Sort: Bust probability</option>
          <option value="confidence">Sort: Confidence</option>
          <option value="expectedError">Sort: Expected error</option>
        </select>
      </div>

      <Panel title={`Regions Requiring Attention · D${day}`}>
        {list.error ? <ErrorState message={list.error} onRetry={list.reload} />
          : list.loading && !list.data ? <Skeleton className="h-64" />
            : <DataTable columns={columns} rows={items} onRowClick={(r) => setRegion(r.region.code)} empty="No assessments for this day" />}
      </Panel>

      {region && (
        <div className="grid gap-4 lg:grid-cols-[390px_1fr]">
          <RegionDetailPanel detail={detail} onClose={() => setRegion(null)} />
          <div className="space-y-4">
            <Panel title="Confidence curve (Day 1–10)">
              {detail.data ? <HorizonChart data={detail.data.curve} selectedDay={day} /> : <Skeleton className="h-64" />}
            </Panel>
            <Panel title="AI explanation">
              {detail.data ? <ContributionBars contributors={detail.data.selected.contributors} /> : <Skeleton className="h-40" />}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}