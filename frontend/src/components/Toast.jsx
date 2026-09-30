import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

const STYLE = {
  success: { Icon: CheckCircle2, color: '#22c55e' },
  error: { Icon: AlertCircle, color: '#ef4444' },
  info: { Icon: Info, color: '#22d3ee' },
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, message, type }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[3000] space-y-2">
        <AnimatePresence>
          {items.map(({ id, message, type }) => {
            const { Icon, color } = STYLE[type] || STYLE.info;
            return (
              <motion.div key={id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                className="glass flex max-w-xs items-center gap-2 px-3 py-2 text-sm">
                <Icon size={16} style={{ color }} /> <span>{message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}