import { RiskBadge } from './Badges.jsx';
import { metricValue, sortByAttention } from '../utils/risk.js';

export default function AttentionList({ items = [], metric, onSelect, limit = 6 }) {
  const rows = sortByAttention(metric, items).slice(0, limit);
  return (
    <ul className="divide-line divide-y">
      {rows.map((it) => (
        <li key={it.id}>
          <button onClick={() => onSelect(it.region.code)}
            className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-white/5">
            <div>
              <div className="text-sm font-medium">{it.region.name}</div>
              <div className="text-xs text-slate-400">{it.primaryDriver}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums text-slate-300">{metricValue(metric, it)}</span>
              <RiskBadge level={it.riskLevel} />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}