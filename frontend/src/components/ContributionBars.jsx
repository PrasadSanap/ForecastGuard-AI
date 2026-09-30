import { motion } from 'framer-motion';

/** Horizontal bars for the model-generated feature contributions (percentages sum to ~100). */
export default function ContributionBars({ contributors = [], limit = 6 }) {
  const top = contributors.slice(0, limit);
  const max = Math.max(...top.map((c) => c.contribution), 1);
  return (
    <ul className="space-y-2.5">
      {top.map((c, i) => (
        <li key={c.key}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-300">{c.feature}</span>
            <span className="tabular-nums text-slate-400">{c.contribution}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400"
              initial={{ width: 0 }} animate={{ width: `${(c.contribution / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}