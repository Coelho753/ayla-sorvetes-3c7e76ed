import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type CartItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  syncing: boolean;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: CartItem["id"]) => void;
  setQuantity: (id: CartItem["id"], qty: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "ayla.cart";
const CartContext = createContext<CartContextValue | null>(null);

function normalizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const x = r as Record<string, unknown>;
      const id = (x.id ?? x._id ?? x.productId) as CartItem["id"] | undefined;
      const name = (x.name ?? x.nome) as string | undefined;
      const price = Number(x.price ?? x.preco ?? 0);
      const quantity = Number(x.quantity ?? x.qty ?? x.quantidade ?? 1);
      const image = (x.image ?? x.imagem) as string | undefined;
      const category = (x.category ?? x.categoria) as string | undefined;
      if (!id || !name) return null;
      return { id, name, price, quantity, image, category };
    })
    .filter(Boolean) as CartItem[];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const skipNextPush = useRef(false);

  // Hidratação inicial: localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persistir local sempre
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // Quando usuário loga: tenta puxar carrinho do backend e mescla com local
  useEffect(() => {
    if (!hydrated || !user) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const { data } = await api.get<Record<string, unknown>>("/cart");
        if (cancelled) return;
        const remote = normalizeItems(
          (data.items as unknown) ?? (data.itens as unknown) ?? (Array.isArray(data) ? data : []),
        );
        // Mescla: soma quantidades por id
        setItems((local) => {
          const map = new Map<CartItem["id"], CartItem>();
          [...remote, ...local].forEach((it) => {
            const ex = map.get(it.id);
            if (ex) map.set(it.id, { ...ex, quantity: ex.quantity + it.quantity });
            else map.set(it.id, { ...it });
          });
          const merged = Array.from(map.values());
          // se mesclou alterações locais, faz push
          if (local.length > 0) {
            api.put("/cart", { items: merged }).catch(() => {});
          }
          skipNextPush.current = true;
          return merged;
        });
      } catch {
        // backend pode ainda não ter /cart — segue só com localStorage
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hydrated]);

  // Push debounced ao backend quando logado
  useEffect(() => {
    if (!hydrated || !user) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      api.put("/cart", { items }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(t);
  }, [items, hydrated, user]);

  const add = useCallback<CartContextValue["add"]>((item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + qty } : p));
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const remove = useCallback<CartContextValue["remove"]>((id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>((id, qty) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    if (user) api.delete("/cart").catch(() => {});
  }, [user]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, total, syncing, add, remove, setQuantity, clear };
  }, [items, syncing, add, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
