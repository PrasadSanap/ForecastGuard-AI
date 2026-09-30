import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, TOKEN_KEY } from '../services/api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi.me()
      .then((r) => setUser(r.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('fg:unauthorized', onUnauthorized);
    return () => window.removeEventListener('fg:unauthorized', onUnauthorized);
  }, []);

  const value = useMemo(() => ({
    user, loading,
    login: async (email, password) => {
      const r = await authApi.login(email, password);
      localStorage.setItem(TOKEN_KEY, r.token);
      setUser(r.user);
      return r.user;
    },
    logout: () => { localStorage.removeItem(TOKEN_KEY); setUser(null); },
  }), [user, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}