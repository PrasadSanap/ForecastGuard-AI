import { useRef, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import useApi from '../hooks/useApi.js';
import { analyticsApi, dashboardApi, modelApi } from '../services/api.js';
import Panel from '../components/Panel.jsx';
import { Skeleton } from '../components/States.jsx';
import { fmtDate } from '../utils/time.js';

const REPORTS = [
  { id: 'reliability', title: 'Forecast Reliability Report' },
  { id: 'regional', title: 'Regional Risk Report' },
  { id: 'historical', title: 'Historical Error Report' },
  { id: 'explanation', title: 'Model Explanation Report' },
];

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [active, setActive] = useState('reliability');
  const printRef = useRef(null);
  const overview = useApi(() => dashboardApi.overview(), []);
  const regionAnalytics = useApi(() => analyticsApi.regions({}), []);
  const health = useApi(() => modelApi.health(), []);

  const doPrint = () => window.print();
  const exportCSV = () => {
    if (active === 'regional' && regionAnalytics.data) return download('regional-risk-report.csv', toCSV(regionAnalytics.data.regions));
    if (active === 'reliability' && overview.data) return download('forecast-reliability-report.csv', toCSV(overview.data.trend));
    if (active === 'historical' && regionAnalytics.data) return download('historical-error-report.csv', toCSV(regionAnalytics.data.regions));
  };

  return (
    <div className="space-y-4">
      <style>{'@media print { .no-print { display: none !important; } body { background: white !important; color: black !important; } }'}</style>
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Reports</h2><p className="text-sm text-slate-400">Print-friendly reports and CSV exports.</p></div>
        <div className="flex gap-2"><button className="btn" onClick={doPrint}><Printer size={14} /> Print</button><button className="btn" onClick={exportCSV}><Download size={14} /> Export CSV</button></div>
      </div>

      <div className="no-print glass flex gap-2 p-3">
        {REPORTS.map((r) => <button key={r.id} onClick={() => setActive(r.id)} className={`rounded-md border px-3 py-1 text-xs font-medium ${active === r.id ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-panel2 text-slate-300'}`}>{r.title}</button>)}
      </div>

      <div ref={printRef} className="glass space-y-4 p-6">
        <header className="border-b border-line pb-4">
          <h1 className="text-xl font-bold">{REPORTS.find((r) => r.id === active).title}</h1>
          <p className="text-xs text-slate-400">ForecastGuard AI — AI-Powered Forecast Reliability &amp; Bust Detection · Generated {fmtDate(new Date())} · DEMONSTRATION MODE</p>
          <p className="mt-1 text-xs text-slate-500">Prototype decision-support output. Not an official NCMRWF forecast or product.</p>
        </header>

        {active === 'reliability' && (overview.loading ? <Skeleton className="h-64" /> : overview.data && (
          <div>
            <p className="text-sm">Overall confidence: <b>{overview.data.kpis.overallConfidence}%</b> · Average bust probability: <b>{overview.data.kpis.averageBustProbability}%</b> · Regions requiring attention: <b>{overview.data.kpis.regionsRequiringAttention}</b></p>
            <p className="mt-2 text-sm text-slate-300">{overview.data.insight}</p>
            <table className="mt-3 w-full text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-slate-400"><th className="py-1">Day</th><th>Confidence</th><th>Bust probability</th></tr></thead>
              <tbody>{overview.data.trend.map((t) => <tr key={t.day} className="border-b border-line/50"><td className="py-1">D{t.day}</td><td>{t.confidence}%</td><td>{t.bustProbability}%</td></tr>)}</tbody></table>
          </div>
        ))}

        {(active === 'regional' || active === 'historical') && (regionAnalytics.loading ? <Skeleton className="h-64" /> : regionAnalytics.data && (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-xs uppercase text-slate-400"><th className="py-1">Region</th><th>Records</th><th>MAE</th><th>Mean norm. error</th><th>Bust frequency</th></tr></thead>
            <tbody>{regionAnalytics.data.regions.map((r) => <tr key={r.regionId} className="border-b border-line/50"><td className="py-1">{r.region}</td><td>{r.count}</td><td>{r.mae ?? '—'}</td><td>{r.meanNormalizedError}</td><td>{r.bustFrequency}%</td></tr>)}</tbody>
          </table>
        ))}

        {active === 'explanation' && (health.loading ? <Skeleton className="h-64" /> : health.data && (
          <div className="text-sm">
            <p>Model version <b>{health.data.model.version}</b>, trained on <b>{health.data.model.trainingSamples}</b> demonstration records. Held-out bust AUC: <b>{health.data.model.metrics && health.data.model.metrics.aucBust}</b>.</p>
            <p className="mt-2 text-slate-400">{health.data.model.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}