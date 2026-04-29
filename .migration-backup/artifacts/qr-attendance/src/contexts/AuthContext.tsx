import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
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

async function performLogin(): Promise<{ token: string; admin: AuthAdmin } | null> {
  try {
    const data = await loginRequest({ email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD });
    localStorage.setItem("qr_token", data.token);
    localStorage.setItem("qr_admin", JSON.stringify(data.admin));
    return { token: data.token, admin: data.admin };
  } catch (err) {
    console.error("Auto-login failed", err);
    return null;
  }
}

let inFlightLogin: Promise<{ token: string; admin: AuthAdmin } | null> | null = null;

export async function ensureFreshToken(): Promise<string | null> {
  if (!inFlightLogin) {
    inFlightLogin = performLogin().finally(() => {
      inFlightLogin = null;
    });
  }
  const result = await inFlightLogin;
  return result?.token ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("qr_token"));
  const [admin, setAdmin] = useState<AuthAdmin | null>(() => {
    const stored = localStorage.getItem("qr_admin");
    return stored ? JSON.parse(stored) : null;
  });
  const [isReady, setIsReady] = useState<boolean>(false);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    let cancelled = false;
    (async () => {
      const result = await ensureFreshToken();
      if (cancelled) return;
      if (result) {
        setToken(result);
        const stored = localStorage.getItem("qr_admin");
        if (stored) setAdmin(JSON.parse(stored));
      }
      setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("qr_token");
    localStorage.removeItem("qr_admin");
    setToken(null);
    setAdmin(null);
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
