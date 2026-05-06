import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStorage, onUnauthorized, extractApiError } from "@/lib/api";

export type User = {
  id: string | number;
  name?: string;
  email: string;
  role?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function pickTokens(data: Record<string, unknown>) {
  const access =
    (data.accessToken as string) ?? (data.access_token as string) ?? (data.token as string) ?? null;
  const refresh = (data.refreshToken as string) ?? (data.refresh_token as string) ?? null;
  return { access, refresh };
}

// Normaliza usuário do backend (PT/Mongo) para o shape do app.
function normalizeUser(raw: Record<string, unknown> | null | undefined): User | null {
  if (!raw) return null;
  const id = (raw.id as User["id"]) ?? (raw._id as User["id"]);
  const email = raw.email as string;
  if (!id || !email) return null;
  return {
    id,
    email,
    name: (raw.name as string) ?? (raw.nome as string) ?? undefined,
    role: (raw.role as string) ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const tryEndpoints = ["/users/me", "/auth/me", "/usuarios/me"];
      let payload: Record<string, unknown> | null = null;
      for (const ep of tryEndpoints) {
        try {
          const { data } = await api.get<Record<string, unknown>>(ep);
          payload = data;
          break;
        } catch {
          /* tenta o próximo */
        }
      }
      if (!payload) throw new Error("not-found");
      const raw = (payload.user as Record<string, unknown> | undefined) ?? payload;
      setUser(normalizeUser(raw));
    } catch {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccess() && !tokenStorage.getRefresh()) {
      setUser(null);
      return;
    }
    await fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    onUnauthorized(() => setUser(null));
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        // Backend usa nomes em PT: { email, senha }
        const { data } = await api.post("/auth/login", { email, senha: password, password });
        const { access, refresh } = pickTokens(data);
        if (!access) throw new Error("Resposta de login inválida.");
        tokenStorage.set(access, refresh);
        const apiUser = normalizeUser(
          (data.user as Record<string, unknown>) ?? (data.usuario as Record<string, unknown>),
        );
        if (apiUser) setUser(apiUser);
        else await fetchMe();
      } catch (err) {
        const msg = extractApiError(err, "Falha ao entrar. Verifique seu email e senha.");
        // Erro de JWT mal configurado no backend
        if (/secretOrPrivateKey/i.test(msg)) {
          throw new Error("O servidor de autenticação está sem a chave JWT configurada. Avise o administrador.");
        }
        throw new Error(msg);
      }
    },
    [fetchMe],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        // Backend usa { nome, email, senha }
        const { data } = await api.post("/auth/register", {
          nome: name,
          name,
          email,
          senha: password,
          password,
        });
        const { access, refresh } = pickTokens(data);
        if (access) {
          tokenStorage.set(access, refresh);
          const apiUser = normalizeUser(
            (data.user as Record<string, unknown>) ?? (data.usuario as Record<string, unknown>),
          );
          if (apiUser) setUser(apiUser);
          else await fetchMe();
        }
      } catch (err) {
        throw new Error(extractApiError(err, "Falha ao cadastrar."));
      }
    },
    [fetchMe],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
