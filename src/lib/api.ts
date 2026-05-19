import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "@/config/api";

const ACCESS_KEY = "ayla.accessToken";
const REFRESH_KEY = "ayla.refreshToken";

let accessTokenMemory: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
const onUnauthorizedHandlers: Array<() => void> = [];

export function onUnauthorized(cb: () => void) {
  onUnauthorizedHandlers.push(cb);
}

export const tokenStorage = {
  getAccess(): string | null {
    if (accessTokenMemory) return accessTokenMemory;
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(ACCESS_KEY);
    accessTokenMemory = v;
    return v;
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string | null, refresh?: string | null) {
    accessTokenMemory = access;
    if (typeof window === "undefined") return;
    if (access) window.localStorage.setItem(ACCESS_KEY, access);
    else window.localStorage.removeItem(ACCESS_KEY);
    if (refresh !== undefined) {
      if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
      else window.localStorage.removeItem(REFRESH_KEY);
    }
  },
  clear() {
    accessTokenMemory = null;
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
      const newAccess = data.accessToken ?? data.access_token ?? data.token;
      const newRefresh = data.refreshToken ?? data.refresh_token ?? refresh;
      if (!newAccess) return null;
      tokenStorage.set(newAccess, newRefresh);
      return newAccess as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      original._retry = true;
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        if (!original.headers) original.headers = {} as never;
        (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
        return api(original);
      }
      tokenStorage.clear();
      onUnauthorizedHandlers.forEach((cb) => cb());
    }
    return Promise.reject(error);
  },
);

export function extractApiError(err: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (axios.isAxiosError(err)) {
    // Falhas de rede sem resposta — não vazar URL/stack interna
    if (!err.response) return "Sem conexão com o servidor. Tente novamente.";
    if (err.response.status >= 500) return "O servidor está temporariamente indisponível.";
    const data = err.response?.data as
      | { message?: string | string[]; error?: string; errors?: Array<{ msg?: string; path?: string }> }
      | undefined;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length) {
      return data.errors.map((e) => (e.path ? `${e.path}: ${e.msg}` : e.msg)).filter(Boolean).join(" • ");
    }
    const msg = data?.message ?? data?.error;
    // Filtra mensagens internas (stack traces, secrets, paths)
    const isInternal = (s: string) =>
      /secretOrPrivateKey|ECONN|ENOTFOUND|stack|at \w+\s\(|node_modules|process\.env/i.test(s);
    if (Array.isArray(msg)) {
      const safe = msg.filter((m) => !isInternal(m));
      if (safe.length) return safe.join(", ");
    }
    if (typeof msg === "string" && !isInternal(msg)) return msg;
  }
  return fallback;
}
