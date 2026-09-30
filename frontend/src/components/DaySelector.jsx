export default function DaySelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Forecast day">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
        <button key={d} onClick={() => onChange(d)}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
            d === value ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-panel2 hover:border-accent/50 text-slate-300'}`}>
          D{d}
        </button>
      ))}
    </div>
  );
}