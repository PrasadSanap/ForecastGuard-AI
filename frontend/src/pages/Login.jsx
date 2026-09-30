import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Radar } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { ModeBadge } from '../components/Badges.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { errMsg } from '../services/api.js';

const DEMO = [
  { role: 'Analyst', email: 'analyst@forecastguard.demo', password: 'Analyst@123' },
  { role: 'Researcher', email: 'researcher@forecastguard.demo', password: 'Researcher@123' },
  { role: 'Admin', email: 'admin@forecastguard.demo', password: 'Admin@123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      navigate((loc.state && loc.state.from) || '/', { replace: true });
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="border-line bg-panel/60 hidden flex-col justify-between border-r p-10 lg:flex">
        <Logo size="lg" />
        <div>
          <Radar className="text-accent mb-4" size={34} />
          <h1 className="text-3xl font-semibold leading-tight">Know when a forecast may fail —<br />before it matters.</h1>
          <p className="mt-4 max-w-md text-sm text-slate-400">
            ForecastGuard AI analyzes forecast behavior, historical errors and atmospheric indicators to estimate where and when a
            medium-range forecast may become unreliable. It does not predict weather from scratch.
          </p>
        </div>
        <p className="text-xs text-slate-500">AI-based forecast reliability prototype · not an official NCMRWF system · uses demonstration data</p>
      </div>

      <div className="grid place-items-center p-6">
        <form onSubmit={submit} className="glass w-full max-w-sm space-y-4 p-6">
          <div className="lg:hidden"><Logo /></div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sign in</h2><ModeBadge />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input mt-1 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required className="input mt-1 w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <div className="border-line border-t pt-3">
            <div className="label mb-2">Demo accounts (fills the form)</div>
            <div className="flex gap-2">
              {DEMO.map((d) => (
                <button type="button" key={d.role} className="btn flex-1 px-2 text-xs" onClick={() => { setEmail(d.email); setPassword(d.password); }}>{d.role}</button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}