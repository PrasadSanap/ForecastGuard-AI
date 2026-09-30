export default function DataTable({ columns, rows, keyField = 'id', onRowClick, empty = 'No data' }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-500">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-line border-b text-[11px] uppercase tracking-wider text-slate-400">
            {columns.map((c) => <th key={c.key} className="whitespace-nowrap px-3 py-2 font-medium">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[keyField]} onClick={() => onRowClick && onRowClick(r)}
              className={`border-line/60 border-b ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}`}>
              {columns.map((c) => <td key={c.key} className="whitespace-nowrap px-3 py-2 tabular-nums">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}