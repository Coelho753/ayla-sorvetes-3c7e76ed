import { useEffect, useState } from "react";
import { useCart, type CartItem } from "@/contexts/CartContext";
import {
  CATEGORY_LABEL,
  WHOLESALE_THRESHOLD,
  normalizeCategory,
  resolveWholesalePrice,
  type WholesaleCategory,
} from "@/lib/wholesale";

export type CartPricing = {
  // por item: preço efetivo aplicado
  effectivePrice: (it: CartItem) => number;
  // contagem por categoria participante de atacado
  counts: Record<WholesaleCategory, number>;
  // categorias que já entraram no atacado
  activeCategories: WholesaleCategory[];
  // total no atacado x total cheio
  total: number;
  baseTotal: number;
  discount: number;
};

function useWholesaleVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV((x) => x + 1);
    window.addEventListener("wholesale:changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("wholesale:changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return v;
}

export function useCartPricing(): CartPricing {
  const { items } = useCart();
  useWholesaleVersion();

  const counts: Record<WholesaleCategory, number> = { tub: 0, cup: 0, popsicle: 0 };
  for (const it of items) {
    const cat = normalizeCategory(it.category);
    if (cat) counts[cat] += it.quantity;
  }
  const activeCategories = (Object.keys(counts) as WholesaleCategory[]).filter(
    (c) => counts[c] >= WHOLESALE_THRESHOLD,
  );

  function effectivePrice(it: CartItem) {
    const cat = normalizeCategory(it.category);
    if (!cat || counts[cat] < WHOLESALE_THRESHOLD) return it.price;
    return resolveWholesalePrice({ productId: it.id, category: cat, basePrice: it.price });
  }

  let total = 0;
  let baseTotal = 0;
  for (const it of items) {
    baseTotal += it.price * it.quantity;
    total += effectivePrice(it) * it.quantity;
  }

  return {
    effectivePrice,
    counts,
    activeCategories,
    total,
    baseTotal,
    discount: Math.max(0, baseTotal - total),
  };
}

export { WHOLESALE_THRESHOLD, CATEGORY_LABEL };
