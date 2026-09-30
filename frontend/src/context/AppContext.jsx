import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useApi from '../hooks/useApi.js';
import { alertApi, dashboardApi, healthApi, regionsApi } from '../services/api.js';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

/** Global selections (forecast day, region) + data shared by layout and pages. */
export function AppProvider({ children }) {
  const [day, setDay] = useState(6);
  const [region, setRegion] = useState(null);      // region code, e.g. "maharashtra", or null = all
  const overview = useApi(() => dashboardApi.overview(), []);
  const regionsRes = useApi(() => regionsApi.list(), []);
  const alertsRes = useApi(() => alertApi.list({ status: 'Active' }), []);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => healthApi()
      .then((h) => alive && setHealth({ ...h, checkedAt: Date.now() }))
      .catch(() => alive && setHealth({ status: 'down', database: 'unknown', mlService: 'down', checkedAt: Date.now() }));
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const value = useMemo(() => ({
    day, setDay, region, setRegion,
    overview, health,
    regions: (regionsRes.data && regionsRes.data.regions) || [],
    activeAlerts: alertsRes.data ? alertsRes.data.items.length : 0,
  }), [day, region, overview, health, regionsRes.data, alertsRes.data]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}