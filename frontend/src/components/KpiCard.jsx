import useCountUp from '../hooks/useCountUp.js';

export default function KpiCard({ label, value, suffix = '', decimals = 0, icon: Icon, tone = '#22d3ee', hint }) {
  const v = useCountUp(value);
  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        <span className="rounded-lg p-1.5" style={{ background: `${tone}22`, color: tone }}><Icon size={16} /></span>
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">
        {value === null || value === undefined ? '—' : v.toFixed(decimals)}
        <span className="text-lg text-slate-400">{suffix}</span>
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}