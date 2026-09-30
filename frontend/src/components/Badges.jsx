import { riskColor } from '../utils/risk.js';

export function RiskBadge({ level }) {
  const c = riskColor(level);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
      style={{ color: c, background: `${c}1f`, border: `1px solid ${c}55` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {level || '—'}
    </span>
  );
}

export function ModeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-300">
      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" /> DEMONSTRATION MODE
    </span>
  );
}

export function LabelTag({ children, tone = '#22d3ee' }) {
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: tone, background: `${tone}18`, border: `1px solid ${tone}40` }}>
      {children}
    </span>
  );
}