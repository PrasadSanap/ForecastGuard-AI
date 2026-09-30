import { useState } from 'react';
import useApi from '../hooks/useApi.js';
import { useApp } from '../context/AppContext.jsx';
import { analyticsApi, errorApi } from '../services/api.js';
import Panel from '../components/Panel.jsx';
import DataTable from '../components/DataTable.jsx';
import { LabelTag } from '../components/Badges.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/States.jsx';
import HorizonChart from '../charts/HorizonChart.jsx';
import ScatterChart from '../charts/ScatterChart.jsx';

const VARIABLES = ['', 'rainfall', 'temperature', 'windSpeed', 'pressure', 'humidity'];

export default function Analytics() {
  const { regions, region, setRegion } = useApp();
  const [variable, setVariable] = useState('');
  const [page, setPage] = useState(1);
  const filters = { region: region || undefined, variable: variable || undefined };

  const overview = useApi(() => analyticsApi.overview(filters), [region, variable]);
  const byHorizon = useApi(() => analyticsApi.horizon(filters), [region, variable]);
  const byRegion = useApi(() => analyticsApi.regions({ variable: variable || undefined }), [variable]);
  const table = useApi(() => errorApi.list({ ...filters, page, limit: 15, sort: 'absoluteError' }), [region, variable, page]);

  const scatterData = byHorizon.data ? byHorizon.data.confidenceVsError.filter((d) => d.predictedConfidence !== null)
    .map((d) => ({ ...d, day: `D${d.day}` })) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Historical Forecast Error Analytics</h2><p className="text-sm text-slate-400">Bust frequency, MAE/RMSE by horizon and region, and confidence-vs-error.</p></div>
        <LabelTag>Demonstration data</LabelTag>
      </div>

      <div className="glass flex flex-wrap items-center gap-3 p-3">
        <select className="input" value={region || ''} onChange={(e) => setRegion(e.target.value || null)}>
          <option value="">All regions</option>{regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
        </select>
        <select className="input" value={variable} onChange={(e) => setVariable(e.target.value)}>
          <option value="">All variables (normalised error)</option>
          {VARIABLES.slice(1).map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {overview.error && <ErrorState message={overview.error} onRetry={overview.reload} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Bust frequency by horizon" subtitle={variable ? 'MAE (unit)' : 'Normalised error (unitless)'}>
          {byHorizon.loading && !byHorizon.data ? <Skeleton className="h-64" /> : (
            <HorizonChart height={260} data={(byHorizon.data ? byHorizon.data.horizons : []).map((h) => ({ day: h.day, confidence: h.bustFrequency, bustProbability: variable ? h.mae || 0 : h.meanNormalizedError * 100 }))}
              keys={['confidence']} />
          )}
        </Panel>
        <Panel title="Predicted confidence vs. observed error" subtitle="Each point is a forecast horizon (D1–D10)">
          {byHorizon.loading && !byHorizon.data ? <Skeleton className="h-64" />
            : scatterData.length ? <ScatterChart data={scatterData} xKey="predictedConfidence" yKey="observedMeanNormalizedError" xLabel="Predicted confidence (%)" yLabel="Observed normalised error" />
              : <EmptyState title="Not enough data" hint="Run the seed script to generate risk assessments." />}
        </Panel>
      </div>

      <Panel title="Region-wise error" subtitle="Sorted by historical bust frequency">
        {byRegion.loading && !byRegion.data ? <Skeleton className="h-64" /> : (
          <DataTable
            columns={[
              { key: 'region', label: 'Region' }, { key: 'count', label: 'Records' },
              { key: 'mae', label: 'MAE', render: (r) => r.mae ?? '—' }, { key: 'meanNormalizedError', label: 'Mean normalised error' },
              { key: 'bustFrequency', label: 'Bust frequency', render: (r) => `${r.bustFrequency}%` },
            ]}
            rows={(byRegion.data ? byRegion.data.regions : []).slice(0, 12)}
            keyField="regionId"
            onRowClick={(r) => setRegion(regions.find((x) => x.name === r.region)?.code)}
          />
        )}
      </Panel>

      <Panel title="Forecast error records" subtitle="Largest absolute errors first" right={
        <div className="flex gap-2 text-xs">
          <button className="btn px-2 py-1" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span className="self-center text-slate-400">Page {page}{table.data ? ` / ${table.data.pages || 1}` : ''}</span>
          <button className="btn px-2 py-1" disabled={table.data && page >= table.data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      }>
        {table.loading && !table.data ? <Skeleton className="h-64" /> : (
          <DataTable
            columns={[
              { key: 'date', label: 'Date', render: (r) => new Date(r.date).toISOString().slice(0, 10) },
              { key: 'region', label: 'Region' }, { key: 'horizon', label: 'Day', render: (r) => `D${r.horizon}` },
              { key: 'variable', label: 'Variable' }, { key: 'forecastValue', label: 'Forecast' }, { key: 'observedValue', label: 'Observed' },
              { key: 'absoluteError', label: 'Abs. error' }, { key: 'relativeError', label: 'Rel. error (%)' },
              { key: 'historicalBust', label: 'Bust?', render: (r) => (r.historicalBust ? 'Yes' : 'No') },
            ]}
            rows={table.data ? table.data.items : []}
          />
        )}
      </Panel>
    </div>
  );
}