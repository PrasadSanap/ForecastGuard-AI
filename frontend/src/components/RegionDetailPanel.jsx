import { motion } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import ContributionBars from './ContributionBars.jsx';
import { LabelTag, RiskBadge } from './Badges.jsx';
import { ErrorState, Skeleton } from './States.jsx';
import { confBand } from '../utils/risk.js';

const Tile = ({ label, value, sub, color }) => (
  <div className="border-line bg-panel2 rounded-lg border p-3">
    <div className="label">{label}</div>
    <div className="mt-1 text-xl font-semibold tabular-nums" style={color ? { color } : undefined}>{value}</div>
    {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
  </div>
);

/** Slide-in detail panel. `detail` is the useApi() state for GET /bust-risk/:region?day= */
export default function RegionDetailPanel({ detail, onClose }) {
  const { data, loading, error, reload } = detail;
  return (
    <motion.aside key={data ? data.region.code : 'loading'} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }} className="glass p-4">
      {error && <ErrorState message={error} onRetry={reload} />}
      {!error && (loading || !data) && (
        <div className="space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-20" /><Skeleton className="h-40" /></div>
      )}
      {!error && data && (() => {
        const s = data.selected;
        const band = confBand(s.confidence);
        return (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{data.region.name}</h3>
                <p className="text-xs text-slate-400">{data.region.zone} India · Forecast Day <b className="text-slate-200">D{data.selectedDay}</b></p>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge level={s.riskLevel} />
                <button className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Close panel"><X size={16} /></button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Tile label="Confidence" value={`${s.confidence}%`} sub={`${band.label}`} color={band.color} />
              <Tile label="Bust prob." value={`${s.bustProbability}%`} sub="model estimate" />
              <Tile label="Exp. error" value={s.expectedErrorLevel} sub={`${s.expectedError} units`} />
            </div>

            <h4 className="mb-2 mt-4 text-sm font-semibold">Why is this forecast at risk?</h4>
            <ContributionBars contributors={s.contributors} />
            <p className="mt-2 text-[11px] text-slate-500">Primary driver: <b className="text-slate-300">{s.primaryDriver}</b> · Model-generated explanation (importance-weighted deviation, not SHAP).</p>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center gap-2">
                <h4 className="text-sm font-semibold">Potential event indicators</h4>
                <LabelTag tone="#f59e0b">Prototype Event Detection</LabelTag>
              </div>
              {data.events.length === 0 ? (
                <p className="text-xs text-slate-500">No rule-based event indicator triggered for this region.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.events.map((e) => (
                    <span key={e.event} title={e.basis} className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">
                      <Zap size={11} /> {e.event}
                    </span>
                  ))}
                </div>
              )}
              {s.eventUplift > 0 && <p className="mt-1 text-[11px] text-slate-500">Event indicators added +{s.eventUplift} points to bust probability.</p>}
            </div>
          </>
        );
      })()}
    </motion.aside>
  );
}