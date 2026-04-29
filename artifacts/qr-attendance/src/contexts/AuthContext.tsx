import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { login as loginRequest } from "@workspace/api-client-react";

interface AuthAdmin {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  token: string | null;
  admin: AuthAdmin | null;
  logout: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_EMAIL = "jashwanth038@gmail.com";
const DEFAULT_PASSWORD = "ADMIN";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("qr_token"));
  const [admin, setAdmin] = useState<AuthAdmin | null>(() => {
    const stored = localStorage.getItem("qr_admin");
    return stored ? JSON.parse(stored) : null;
  });
  const [isReady, setIsReady] = useState<boolean>(!!localStorage.getItem("qr_token"));

  useEffect(() => {
    if (token) {
      setIsReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await loginRequest({ email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD });
        if (cancelled) return;
        localStorage.setItem("qr_token", data.token);
        localStorage.setItem("qr_admin", JSON.stringify(data.admin));
        setToken(data.token);
        setAdmin(data.admin);
      } catch (err) {
        console.error("Auto-login failed", err);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem("qr_token");
    localStorage.removeItem("qr_admin");
    setToken(null);
    setAdmin(null);
    setIsReady(false);
  }, []);

  return (
    <AuthContext.Provider value={{ token, admin, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
