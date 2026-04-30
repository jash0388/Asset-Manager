import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { customFetch } from "@workspace/api-client-react";

export type AuthRole = "admin" | "mentor";

export type AuthAdmin = { id: number; email: string; name: string };
export type AuthMentor = { id: number; email: string; name: string };

interface AuthContextValue {
  role: AuthRole | null;
  admin: AuthAdmin | null;
  mentor: AuthMentor | null;
  token: string | null;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  loginMentor: (email: string, password: string) => Promise<void>;
  loginBypass: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "qr_token";
const ROLE_KEY = "qr_role";
const PROFILE_KEY = "qr_profile";

function readStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function ensureFreshToken(): Promise<string | null> {
  // No silent re-login; if the token is rejected, the user must log in again.
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState<AuthRole | null>(() => {
    const r = localStorage.getItem(ROLE_KEY);
    return r === "admin" || r === "mentor" ? r : null;
  });
  const [admin, setAdmin] = useState<AuthAdmin | null>(() =>
    localStorage.getItem(ROLE_KEY) === "admin" ? readStored<AuthAdmin>(PROFILE_KEY) : null
  );
  const [mentor, setMentor] = useState<AuthMentor | null>(() =>
    localStorage.getItem(ROLE_KEY) === "mentor" ? readStored<AuthMentor>(PROFILE_KEY) : null
  );
  const [loading] = useState(false);

  const persist = useCallback(
    (newToken: string, newRole: AuthRole, profile: AuthAdmin | AuthMentor) => {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(ROLE_KEY, newRole);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setToken(newToken);
      setRole(newRole);
      if (newRole === "admin") {
        setAdmin(profile as AuthAdmin);
        setMentor(null);
      } else {
        setMentor(profile as AuthMentor);
        setAdmin(null);
      }
    },
    []
  );

  const loginAdmin = useCallback(
    async (email: string, password: string) => {
      const res = await customFetch<{ token: string; admin: AuthAdmin }>("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      persist(res.token, "admin", res.admin);
    },
    [persist]
  );

  const loginMentor = useCallback(
    async (email: string, password: string) => {
      const res = await customFetch<{ token: string; mentor: AuthMentor }>(
        "/api/auth/mentor-login",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      persist(res.token, "mentor", res.mentor);
    },
    [persist]
  );

  const loginBypass = useCallback(() => {
    const bypassAdmin: AuthAdmin = {
      id: -1,
      email: "bypass@local",
      name: "Admin (bypass)",
    };
    persist("bypass-token", "admin", bypassAdmin);
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setToken(null);
    setRole(null);
    setAdmin(null);
    setMentor(null);
    // Hard redirect so any cached query state is reset.
    if (typeof window !== "undefined") {
      const base = (import.meta as any).env?.BASE_URL || "/";
      window.location.href = `${base}login`.replace(/\/+/g, "/");
    }
  }, []);

  // Keep token state in sync if another tab logs in/out.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) setToken(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider
      value={{ role, admin, mentor, token, loading, loginAdmin, loginMentor, loginBypass, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
