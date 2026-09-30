import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const SERIES = {
  confidence: { name: 'Forecast confidence (%)', color: '#22d3ee' },
  bustProbability: { name: 'Bust probability (%)', color: '#f97316' },
};

function Tip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="border-line bg-panel rounded-lg border px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-semibold">Day {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-medium tabular-nums">{Math.round(p.value * 10) / 10}%</span>
        </div>
      ))}
    </div>
  );
}

/** Reusable Day 1–10 chart. data: [{ day, confidence, bustProbability }] straight from the API. */
export default function HorizonChart({ data = [], selectedDay, height = 260, keys = ['confidence', 'bustProbability'] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#1b2a45" strokeDasharray="3 3" />
        <XAxis dataKey="day" tickFormatter={(d) => `D${d}`} stroke="#64748b" fontSize={11} />
        <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {selectedDay && <ReferenceLine x={selectedDay} stroke="#94a3b8" strokeDasharray="4 4" />}
        {keys.map((k) => (
          <Line key={k} type="monotone" dataKey={k} name={SERIES[k].name} stroke={SERIES[k].color}
            strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}