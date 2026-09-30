import { AlertTriangle, Inbox } from 'lucide-react';

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;

export function ErrorState({ message, onRetry }) {
  return (
    <div className="glass flex flex-col items-center gap-3 p-8 text-center">
      <AlertTriangle className="text-orange-400" />
      <div>
        <p className="font-medium">Could not load data</p>
        <p className="mt-1 text-sm text-slate-400">{message}</p>
        <p className="mt-1 text-xs text-slate-500">Check that the backend, ML service and seed data are running.</p>
      </div>
      {onRetry && <button className="btn" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function EmptyState({ title, hint, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-slate-400">
      <Icon size={22} />
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {hint && <p className="max-w-xs text-xs">{hint}</p>}
    </div>
  );
}