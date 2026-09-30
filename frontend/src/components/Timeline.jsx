import { riskColor } from '../utils/risk.js';

/** D1–D10 strip for one region. Click a cell to switch the forecast day. */
export default function Timeline({ curve = [], day, onSelect }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
      {curve.map((c) => {
        const color = riskColor(c.riskLevel);
        const active = c.day === day;
        return (
          <button key={c.day} onClick={() => onSelect(c.day)}
            className={`bg-panel2 rounded-lg border p-2 text-left transition-colors ${active ? 'border-accent' : 'border-line hover:border-accent/50'}`}
            style={{ borderTop: `3px solid ${color}` }}>
            <div className="text-xs font-semibold">D{c.day}</div>
            <div className="mt-1 text-[11px] tabular-nums text-slate-300">{Math.round(c.confidence)}% conf</div>
            <div className="text-[11px] tabular-nums" style={{ color }}>{Math.round(c.bustProbability)}% bust</div>
          </button>
        );
      })}
    </div>
  );
}