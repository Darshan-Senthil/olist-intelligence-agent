import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAuthConfig,
  fetchMe,
  loginRequest,
  registerRequest,
  setStoredToken,
  getStoredToken,
} from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  status: string;
  data_clearance: string;
  created_at: number;
};

export type AuthConfig = {
  auth_optional: boolean;
  ask_requires_auth: boolean;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  config: AuthConfig | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<{ message: string }>;
  refreshUser: () => Promise<void>;
  canRunLiveQueries: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const t = getStoredToken();
    setToken(t);
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const me = (await fetchMe()) as AuthUser;
      setUser(me);
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const c = (await fetchAuthConfig()) as AuthConfig;
        if (!cancelled) setConfig(c);
        await refreshUser();
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Could not load auth configuration.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const data = await loginRequest(email, password);
    const access = data?.access_token as string | undefined;
    if (!access) throw new Error("No access token returned");
    setStoredToken(access);
    setToken(access);
    setUser(data.user as AuthUser);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setError(null);
    const data = await registerRequest(email, password);
    return { message: String(data?.message ?? "Registered.") };
  }, []);

  const canRunLiveQueries = useMemo(
    () => Boolean(user && user.status === "active"),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      config,
      loading,
      error,
      login,
      logout,
      register,
      refreshUser,
      canRunLiveQueries,
    }),
    [
      token,
      user,
      config,
      loading,
      error,
      login,
      logout,
      register,
      refreshUser,
      canRunLiveQueries,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
