import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { uploadApi } from '../services/api.js';
import { useToast } from './Toast.jsx';

export default function UploadBox({ onDone }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const toast = useToast();

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true); setReport(null);
    try {
      const text = await file.text();
      const res = await uploadApi.forecast(text);
      setReport(res.report);
      toast(`Imported ${res.report.rowsImported} row(s), rejected ${res.report.rowsRejected}`, res.report.rowsImported ? 'success' : 'error');
      onDone && onDone();
    } catch (e) {
      toast((e.response && e.response.data && e.response.data.message) || 'Upload failed', 'error');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const downloadTemplate = async () => {
    const blob = await uploadApi.template();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'forecastguard-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn" onClick={() => inputRef.current.click()} disabled={busy}>
          <Upload size={14} /> {busy ? 'Uploading…' : 'Upload Forecast Dataset (CSV)'}
        </button>
        <button className="btn" onClick={downloadTemplate}><Download size={14} /> Download template</button>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Columns: date, region, horizon, variable, forecast, observed (required); temperature, rainfall, humidity, pressure, windSpeed (optional context).
        Re-uploading the same rows updates them rather than duplicating.
      </p>
      {report && (
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div className="border-line bg-panel2 rounded-lg border p-2.5"><div className="label">Rows imported</div><div className="text-lg font-semibold text-green-400">{report.rowsImported}</div></div>
          <div className="border-line bg-panel2 rounded-lg border p-2.5"><div className="label">Rows rejected</div><div className="text-lg font-semibold text-red-400">{report.rowsRejected}</div></div>
          <div className="border-line bg-panel2 rounded-lg border p-2.5"><div className="label">Missing columns</div><div className="text-sm">{report.missingColumns && report.missingColumns.length ? report.missingColumns.join(', ') : 'None'}</div></div>
          <div className="border-line bg-panel2 rounded-lg border p-2.5"><div className="label">Data quality</div><div className="text-sm font-semibold">{report.quality.label} · {report.quality.acceptedPct}%</div></div>
          {report.rejectionReasons.length > 0 && (
            <div className="border-line bg-panel2 rounded-lg border p-2.5 sm:col-span-4">
              <div className="label mb-1">Rejection reasons</div>
              <ul className="text-xs text-slate-400">{report.rejectionReasons.map((r) => <li key={r.reason}>{r.reason}: {r.count}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}