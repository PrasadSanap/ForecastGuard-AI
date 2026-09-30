export default function Panel({ title, subtitle, right, children, className = '' }) {
  return (
    <section className={`glass ${className}`}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}