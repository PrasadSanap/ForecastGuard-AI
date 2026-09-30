export default function Slider({ label, value, onChange, min = -3, max = 3, step = 0.1, unit = '' }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-accent tabular-nums">{value > 0 ? '+' : ''}{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-line h-1.5 w-full cursor-pointer appearance-none rounded-full accent-cyan-400" />
      <div className="flex justify-between text-[10px] text-slate-500"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}