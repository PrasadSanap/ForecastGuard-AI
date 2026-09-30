import { useState } from 'react';
import { Play } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { simulationApi } from '../services/api.js';
import { errMsg } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import Panel from '../components/Panel.jsx';
import Slider from '../components/Slider.jsx';
import { LabelTag, RiskBadge } from '../components/Badges.jsx';
import { EmptyState } from '../components/States.jsx';
import HorizonChart from '../charts/HorizonChart.jsx';

const DEFAULTS = { rainfallAnomaly: 0, windChange: 0, pressureChange: 0, temperatureAnomaly: 0, historicalError: 1.5 };

export default function Simulator() {
  const { region, regions, setRegion } = useApp();
  const toast = useToast();
  const [horizon, setHorizon] = useState(6);
  const [inputs, setInputs] = useState(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k) => (v) => setInputs((s) => ({ ...s, [k]: v }));

  const run = async () => {
    setBusy(true);
    try {
      const res = await simulationApi.run({ horizon, regionId: region || undefined, ...inputs });
      setResult(res);
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const compareData = result ? [
    { day: 'Before', confidence: result.before.confidence, bustProbability: result.before.bustProbability },
    { day: 'After', confidence: result.after.confidence, bustProbability: result.after.bustProbability },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Forecast Reliability Simulator</h2><p className="text-sm text-slate-400">Adjust atmospheric indicators and see how forecast reliability responds.</p></div>
        <LabelTag tone="#f59e0b">SIMULATION MODE</LabelTag>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Panel title="Scenario inputs">
          <div className="space-y-4">
            <div>
              <label className="label">Region (baseline)</label>
              <select className="input mt-1 w-full" value={region || ''} onChange={(e) => setRegion(e.target.value || null)}>
                <option value="">Neutral baseline (no region)</option>
                {regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Forecast horizon: D{horizon}</label>
              <input type="range" min={1} max={10} step={1} value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}
                className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-cyan-400" />
            </div>
            <Slider label="Rainfall anomaly" value={inputs.rainfallAnomaly} onChange={set('rainfallAnomaly')} unit="σ" />
            <Slider label="Wind change" value={inputs.windChange} onChange={set('windChange')} unit="σ" />
            <Slider label="Pressure change" value={inputs.pressureChange} onChange={set('pressureChange')} unit="σ" />
            <Slider label="Temperature anomaly" value={inputs.temperatureAnomaly} onChange={set('temperatureAnomaly')} unit="σ" />
            <Slider label="Historical error level" value={inputs.historicalError} onChange={set('historicalError')} min={0} max={6} step={0.1} unit=" units" />
            <button className="btn btn-primary w-full" onClick={run} disabled={busy}><Play size={14} /> {busy ? 'Running…' : 'RUN RISK SIMULATION'}</button>
          </div>
        </Panel>

        <div className="space-y-4">
          {!result ? (
            <Panel title="Results"><EmptyState title="No simulation run yet" hint="Set the sliders and click Run Risk Simulation." /></Panel>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Confidence" value={`${result.after.confidence}%`} delta={result.changeInConfidence} />
                <Metric label="Bust probability" value={`${result.after.bustProbability}%`} delta={result.changeInBustProbability} invert />
                <Metric label="Expected error" value={result.after.expectedErrorLevel} />
                <div className="glass p-4"><div className="label">Risk category</div><div className="mt-1"><RiskBadge level={result.after.riskLevel} /></div></div>
              </div>

              <Panel title="Before vs after">
                <HorizonChart data={compareData} height={220} />
              </Panel>

              <Panel title="Which factor changed the risk the most?">
                {result.mostInfluentialFactor ? (
                  <p className="text-sm text-slate-300">
                    <b className="text-accent">{result.mostInfluentialFactor.factor}</b> had the largest effect, changing bust probability by{' '}
                    <b className={result.mostInfluentialFactor.deltaBustProbability >= 0 ? 'text-orange-400' : 'text-green-400'}>
                      {result.mostInfluentialFactor.deltaBustProbability > 0 ? '+' : ''}{result.mostInfluentialFactor.deltaBustProbability} points
                    </b>.
                  </p>
                ) : <p className="text-sm text-slate-400">No inputs were changed from the baseline.</p>}
                <ul className="mt-3 space-y-1 text-xs text-slate-400">
                  {result.factorImpacts.map((f) => <li key={f.factor} className="flex justify-between"><span>{f.factor}</span><span className="tabular-nums">{f.deltaBustProbability > 0 ? '+' : ''}{f.deltaBustProbability}</span></li>)}
                </ul>
              </Panel>
              <p className="text-center text-[11px] text-slate-500">{result.label}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const Metric = ({ label, value, delta, invert }) => {
  const positive = delta > 0;
  const good = invert ? !positive : positive;
  return (
    <div className="glass p-4">
      <div className="label">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {delta !== undefined && <div className={`text-xs ${good ? 'text-orange-400' : 'text-green-400'}`}>{delta > 0 ? '+' : ''}{delta}</div>}
    </div>
  );
};