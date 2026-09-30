import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppProvider } from '../context/AppContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { NAV } from '../utils/nav.js';

function Shell() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const title = (NAV.find((n) => n.path === loc.pathname) || {}).label || 'ForecastGuard AI';

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <TopBar title={title} onMenu={() => setOpen(true)} />
        <main className="mx-auto max-w-[1600px] p-4 lg:p-6">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return <AppProvider><Shell /></AppProvider>;
}