import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearSession,
  getSession,
  login as apiLogin,
  setSession,
  setSessionExpiredHandler,
  tokenExpiresAt,
  type SessionUser,
} from "../lib/api";
import { queryClient } from "../lib/queryClient";

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getSession()?.user ?? null);

  // ProtectedRoute sends the user to /login as soon as `user` is null.
  const expireSession = useCallback(() => {
    clearSession();
    setUser(null);
    queryClient.clear();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(expireSession);
    return () => setSessionExpiredHandler(null);
  }, [expireSession]);

  useEffect(() => {
    const token = getSession()?.token;
    const expiresAt = token ? tokenExpiresAt(token) : null;
    if (!user || expiresAt === null) return;

    const timer = window.setTimeout(expireSession, expiresAt - Date.now());
    return () => window.clearTimeout(timer);
  }, [user, expireSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      async login(email, password) {
        const session = await apiLogin(email, password);
        setSession(session);
        setUser(session.user);
        return session.user;
      },
      logout() {
        clearSession();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
