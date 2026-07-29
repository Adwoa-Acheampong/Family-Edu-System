import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '../types';
import { USERS } from '../data';
import { appConfig } from '../config/env';
import { clearGoogleSession } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  users: User[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  try {
    const id = localStorage.getItem(appConfig.sessionKey);
    if (!id) return null;
    return USERS.find((u) => u.id === id) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  useEffect(() => {
    try {
      if (user) localStorage.setItem(appConfig.sessionKey, user.id);
      else localStorage.removeItem(appConfig.sessionKey);
    } catch {
      /* ignore */
    }
  }, [user]);

  const login = useCallback((next: User) => setUser(next), []);
  const logout = useCallback(() => {
    clearGoogleSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      users: USERS,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
