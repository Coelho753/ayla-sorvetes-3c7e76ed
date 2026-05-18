/**
 * Preço de atacado (substitui o antigo Clube Ayla).
 *
 * Regras:
 * - A partir de `WHOLESALE_THRESHOLD` itens da mesma categoria no carrinho,
 *   todos os itens daquela categoria passam a usar o preço de atacado.
 * - Preço de atacado pode ser definido pelo admin:
 *     a) por produto individual (override)
 *     b) por categoria (aplica em massa a todos da categoria)
 *   Se nada estiver configurado, aplica DEFAULT_WHOLESALE_DISCOUNT (35% off).
 *
 * Persistência: localStorage (até o backend ganhar os campos).
 */

export const WHOLESALE_THRESHOLD = 3;
export const DEFAULT_WHOLESALE_DISCOUNT = 0.35;
export const WHOLESALE_CATEGORIES = ["tub", "cup", "popsicle"] as const;
export type WholesaleCategory = (typeof WHOLESALE_CATEGORIES)[number];

const KEY_PRODUCT = "ayla.wholesale.products"; // { [productId]: number }
const KEY_CATEGORY = "ayla.wholesale.categories"; // { [category]: number }

type Map = Record<string, number>;

function readJson(key: string): Map {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return typeof v === "object" && v ? (v as Map) : {};
  } catch {
    return {};
  }
}
function writeJson(key: string, v: Map) {
  try {
    window.localStorage.setItem(key, JSON.stringify(v));
    window.dispatchEvent(new CustomEvent("wholesale:changed"));
  } catch {
    /* ignore */
  }
}

export function getProductPrices(): Map {
  return readJson(KEY_PRODUCT);
}
export function getCategoryPrices(): Map {
  return readJson(KEY_CATEGORY);
}

export function setProductWholesale(productId: string | number, price: number | null) {
  const m = readJson(KEY_PRODUCT);
  if (price == null || Number.isNaN(price)) delete m[String(productId)];
  else m[String(productId)] = price;
  writeJson(KEY_PRODUCT, m);
}

export function setCategoryWholesale(category: string, price: number | null) {
  const m = readJson(KEY_CATEGORY);
  const key = category.toLowerCase();
  if (price == null || Number.isNaN(price)) delete m[key];
  else m[key] = price;
  writeJson(KEY_CATEGORY, m);
}

/** Resolve o preço de atacado de um item específico. */
export function resolveWholesalePrice(args: {
  productId: string | number;
  category?: string;
  basePrice: number;
}): number {
  const products = getProductPrices();
  const cats = getCategoryPrices();
  const byProduct = products[String(args.productId)];
  if (typeof byProduct === "number" && byProduct > 0) return byProduct;
  const cat = (args.category ?? "").toLowerCase();
  const byCat = cats[cat];
  if (typeof byCat === "number" && byCat > 0) return byCat;
  return Math.round(args.basePrice * (1 - DEFAULT_WHOLESALE_DISCOUNT) * 100) / 100;
}

export function normalizeCategory(c?: string): WholesaleCategory | null {
  const x = (c ?? "").toLowerCase();
  if (x === "tub" || x === "pote") return "tub";
  if (x === "cup" || x === "copo") return "cup";
  if (x === "popsicle" || x === "picole" || x === "picolé") return "popsicle";
  return null;
}

export const CATEGORY_LABEL: Record<WholesaleCategory, string> = {
  tub: "potes",
  cup: "copos",
  popsicle: "picolés",
};
