import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "./api";
import type { Role } from "./types";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  mustChangePassword?: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
    locale?: "id" | "en";
    timezone?: string;
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe: boolean,
    otp?: string,
  ) => Promise<AuthUser>;
  devLogin: (
    role: "admin" | "superadmin" | "manager" | "user",
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await apiRequest<{ user: AuthUser }>("/api/auth/me");
      setUser(response.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const clearSession = () => setUser(null);
    window.addEventListener("averis:unauthorized", clearSession);
    return () =>
      window.removeEventListener("averis:unauthorized", clearSession);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password, rememberMe, otp) => {
        const response = await apiRequest<{ user: AuthUser }>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email, password, rememberMe, otp }),
          },
        );
        setUser(response.user);
        return response.user;
      },
      devLogin: async (role) => {
        const response = await apiRequest<{ user: AuthUser }>(
          "/api/auth/dev-login",
          {
            method: "POST",
            body: JSON.stringify({ role }),
          },
        );
        setUser(response.user);
        return response.user;
      },
      logout: async () => {
        try {
          await apiRequest<void>("/api/auth/logout", { method: "POST" });
        } finally {
          setUser(null);
        }
      },
      refresh,
    }),
    [loading, refresh, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
