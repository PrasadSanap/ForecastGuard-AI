import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function NotAvailable() {
  return (
    <div className="glass mx-auto mt-10 flex max-w-md flex-col items-center gap-3 p-8 text-center">
      <Construction className="text-slate-400" />
      <p className="font-medium">This page is not part of the current build</p>
      <p className="text-sm text-slate-400">Available now: Overview, Forecast Bust Radar and Confidence Map.</p>
      <Link className="btn" to="/">Back to Overview</Link>
    </div>
  );
}