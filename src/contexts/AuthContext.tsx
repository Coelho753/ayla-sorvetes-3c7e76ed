import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStorage, onUnauthorized, extractApiError } from "@/lib/api";

export type Address = {
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
};

export type User = {
  id: string | number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: string;
  roles?: string[];
  admin?: boolean;
  address?: Address;
};

/** Detecta admin em vários formatos que o backend pode devolver. */
export function computeIsAdmin(u: User | null): boolean {
  if (!u) return false;
  const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
  if (u.admin === true) return true;
  if (norm(u.role) === "admin" || norm(u.role) === "administrador" || norm(u.role) === "superadmin") return true;
  if (Array.isArray(u.roles) && u.roles.some((r) => norm(r).includes("admin"))) return true;
  return false;
}

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: Address;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function pickTokens(data: Record<string, unknown>) {
  const access =
    (data.accessToken as string) ?? (data.access_token as string) ?? (data.token as string) ?? null;
  const refresh = (data.refreshToken as string) ?? (data.refresh_token as string) ?? null;
  return { access, refresh };
}

function normalizeAddress(raw: Record<string, unknown> | null | undefined): Address | undefined {
  if (!raw) return undefined;
  const a = raw as Record<string, string | undefined>;
  return {
    cep: a.cep ?? a.zip,
    rua: a.rua ?? a.street ?? a.logradouro,
    numero: a.numero ?? a.number,
    complemento: a.complemento ?? a.complement,
    bairro: a.bairro ?? a.neighborhood,
    cidade: a.cidade ?? a.city,
    estado: a.estado ?? a.state ?? a.uf,
  };
}

function normalizeUser(raw: Record<string, unknown> | null | undefined): User | null {
  if (!raw) return null;
  const id = (raw.id as User["id"]) ?? (raw._id as User["id"]);
  const email = raw.email as string;
  if (!id || !email) return null;
  const fullName = (raw.name as string) ?? (raw.nome as string) ?? "";
  const firstName = (raw.firstName as string) ?? (raw.nome as string) ?? fullName.split(" ")[0];
  const lastName = (raw.lastName as string) ?? (raw.sobrenome as string) ?? fullName.split(" ").slice(1).join(" ");
  return {
    id,
    email,
    name: fullName || [firstName, lastName].filter(Boolean).join(" ") || undefined,
    firstName,
    lastName,
    phone: (raw.phone as string) ?? (raw.telefone as string) ?? undefined,
    role: (raw.role as string) ?? (raw.tipo as string) ?? (raw.perfil as string) ?? undefined,
    roles: Array.isArray(raw.roles) ? (raw.roles as unknown[]).map(String) : undefined,
    admin: raw.isAdmin === true || raw.admin === true || raw.is_admin === true,
    address: normalizeAddress((raw.endereco ?? raw.address) as Record<string, unknown> | undefined),
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
        if (/secretOrPrivateKey/i.test(msg)) {
          throw new Error("O servidor de autenticação está sem a chave JWT configurada. Avise o administrador.");
        }
        throw new Error(msg);
      }
    },
    [fetchMe],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      try {
        const fullName = `${payload.firstName} ${payload.lastName}`.trim();
        // Envia tanto chaves PT quanto EN para máxima compatibilidade.
        const { data } = await api.post("/auth/register", {
          nome: fullName,
          name: fullName,
          firstName: payload.firstName,
          lastName: payload.lastName,
          sobrenome: payload.lastName,
          email: payload.email,
          senha: payload.password,
          password: payload.password,
          endereco: payload.address,
          address: payload.address,
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

  const updateAddress = useCallback(
    async (address: Address) => {
      try {
        await api.put("/users/me", { endereco: address, address });
        await refreshUser();
      } catch (err) {
        throw new Error(extractApiError(err, "Falha ao salvar endereço."));
      }
    },
    [refreshUser],
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
      isAdmin: computeIsAdmin(user),
      login,
      register,
      logout,
      refreshUser,
      updateAddress,
    }),
    [user, loading, login, register, logout, refreshUser, updateAddress],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
