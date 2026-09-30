import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function Tip({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span><span className="font-medium tabular-nums">{p.value} {unit}</span>
        </div>
      ))}
    </div>
  );
}

/** Forecast vs Observation. `xKey` is 'date' for the series view or 'day' for the horizon profile. */
export default function ReplayChart({ data = [], xKey = 'date', unit = '', height = 300 }) {
  const flagged = data.filter((d) => d.flagged);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="#1b2a45" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tickFormatter={(v) => (xKey === 'horizon' ? `D${v}` : String(v).slice(5))} stroke="#64748b" fontSize={11} />
        <YAxis stroke="#64748b" fontSize={11} />
        <Tooltip content={<Tip unit={unit} />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2.5 }} />
        <Line type="monotone" dataKey="observed" name="Observation" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 2.5 }} />
        {flagged.map((d) => (
          <ReferenceDot key={`${d[xKey]}-flag`} x={d[xKey]} y={d.forecast} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}