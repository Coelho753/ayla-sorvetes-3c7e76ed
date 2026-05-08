import type { CartItem } from "@/contexts/CartContext";
import type { Address } from "@/contexts/AuthContext";

export type Order = {
  id: string;
  createdAt: string; // ISO
  items: CartItem[];
  total: number;
  address?: Address | null;
  customerName?: string;
};

const KEY_PREFIX = "ayla.orders";

function keyFor(userId: string | number | null | undefined) {
  return userId ? `${KEY_PREFIX}.${userId}` : `${KEY_PREFIX}.guest`;
}

export function loadOrders(userId: string | number | null | undefined): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as Order[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveOrder(userId: string | number | null | undefined, order: Order) {
  if (typeof window === "undefined") return;
  const list = loadOrders(userId);
  list.unshift(order);
  // mantém no máximo 50
  window.localStorage.setItem(keyFor(userId), JSON.stringify(list.slice(0, 50)));
}

export function newOrderId() {
  return `pd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
