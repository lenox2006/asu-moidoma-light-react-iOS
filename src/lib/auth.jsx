import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, onUnauthorized, setToken } from '../api/client';

const AuthContext = createContext(null);

/** user — текущий пользователь; start — стартовая точка навигации { mark, crumbs } по области видимости. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [start, setStart] = useState({ mark: '', crumbs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await getToken())) { setLoading(false); return; }
      try {
        const d = await api.me();
        if (!cancelled) { setUser(d.user); setStart(d.start); }
      } catch { await setToken(null); }
      if (!cancelled) setLoading(false);
    })();
    return onUnauthorized(() => { setUser(null); setStart({ mark: '', crumbs: [] }); cancelled = true; });
  }, []);

  const login = useCallback(async (login, password) => {
    const d = await api.login(login, password);
    await setToken(d.token);
    setUser(d.user); setStart(d.start);
    return d;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* токен всё равно удаляем */ }
    await setToken(null);
    setUser(null); setStart({ mark: '', crumbs: [] });
  }, []);

  const value = useMemo(() => ({ user, start, loading, login, logout, isSuperadmin: user?.role === 'superadmin' }), [user, start, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth вне AuthProvider');
  return ctx;
};
