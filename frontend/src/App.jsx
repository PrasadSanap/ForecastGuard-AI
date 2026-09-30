import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import BustRadar from './pages/BustRadar.jsx';
import ConfidenceMap from './pages/ConfidenceMap.jsx';
import ForecastReplay from './pages/ForecastReplay.jsx';
import RegionalAnalysis from './pages/RegionalAnalysis.jsx';
import Explanations from './pages/Explanations.jsx';
import Simulator from './pages/Simulator.jsx';
import Alerts from './pages/Alerts.jsx';
import Analytics from './pages/Analytics.jsx';
import ModelHealth from './pages/ModelHealth.jsx';
import Reports from './pages/Reports.jsx';
import NotAvailable from './pages/NotAvailable.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Overview />} />
        <Route path="bust-radar" element={<BustRadar />} />
        <Route path="confidence-map" element={<ConfidenceMap />} />
        <Route path="forecast-replay" element={<ForecastReplay />} />
        <Route path="regions" element={<RegionalAnalysis />} />
        <Route path="explanations" element={<Explanations />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="model-health" element={<ModelHealth />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<NotAvailable />} />
      </Route>
    </Routes>
  );
}