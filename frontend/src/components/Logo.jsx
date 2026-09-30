export default function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'h-12 w-12 text-xl' : 'h-9 w-9 text-sm';
  return (
    <div className="flex items-center gap-3">
      <div className={`${box}grid place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-slate-900 shadow-lg shadow-cyan-500/20`}>FG</div>
      <div className="leading-tight">
        <div className={`${size === 'lg' ? 'text-xl' : 'text-base'}font-semibold`}>ForecastGuard</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400">AI Forecast Reliability Platform</div>
      </div>
    </div>
  );
}