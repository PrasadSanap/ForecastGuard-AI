import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart as RScatter, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';

/** Generic scatter for confidence-vs-error, one point per forecast horizon. */
export default function ScatterChart({ data = [], xKey, yKey, xLabel, yLabel, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RScatter margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
        <CartesianGrid stroke="#1b2a45" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} name={xLabel} stroke="#64748b" fontSize={11} label={{ value: xLabel, position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} />
        <YAxis dataKey={yKey} name={yLabel} stroke="#64748b" fontSize={11} label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
        <ZAxis range={[80, 80]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#0c1424', border: '1px solid #1b2a45', borderRadius: 8, fontSize: 12 }}
          labelFormatter={() => ''} formatter={(v, n) => [v, n]} />
        <Scatter data={data} fill="#22d3ee" />
      </RScatter>
    </ResponsiveContainer>
  );
}