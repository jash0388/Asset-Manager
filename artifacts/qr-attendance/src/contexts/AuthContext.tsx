import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AuthAdmin {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  token: string | null;
  admin: AuthAdmin | null;
  login: (token: string, admin: AuthAdmin) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("qr_token"));
  const [admin, setAdmin] = useState<AuthAdmin | null>(() => {
    const stored = localStorage.getItem("qr_admin");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((newToken: string, newAdmin: AuthAdmin) => {
    localStorage.setItem("qr_token", newToken);
    localStorage.setItem("qr_admin", JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("qr_token");
    localStorage.removeItem("qr_admin");
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
