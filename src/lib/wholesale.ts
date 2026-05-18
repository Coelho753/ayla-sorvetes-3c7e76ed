/**
 * Preço de atacado (substitui o antigo Clube Ayla).
 * Fonte da verdade: backend `/wholesale`. localStorage é cache para
 * exibir preço offline e como fallback enquanto o GET não retorna.
 */
import { api } from "@/lib/api";

export let WHOLESALE_THRESHOLD = 3;
export let DEFAULT_WHOLESALE_DISCOUNT = 0.35;
export const WHOLESALE_CATEGORIES = ["tub", "cup", "popsicle"] as const;
export type WholesaleCategory = (typeof WHOLESALE_CATEGORIES)[number];

const KEY_PRODUCT = "ayla.wholesale.products"; // { [productId]: number }
const KEY_CATEGORY = "ayla.wholesale.categories"; // { [category]: number }
const KEY_CONFIG = "ayla.wholesale.config";

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

/* ============================================================
 * Integração com o backend (`/wholesale`)
 * ========================================================== */

type WholesalePayload = {
  config?: { threshold?: number; defaultDiscount?: number };
  categories?: Record<string, number>;
  products?: Record<string, number>;
};

function applyConfig(cfg?: WholesalePayload["config"]) {
  if (!cfg) return;
  if (typeof cfg.threshold === "number" && cfg.threshold > 0) WHOLESALE_THRESHOLD = cfg.threshold;
  if (typeof cfg.defaultDiscount === "number" && cfg.defaultDiscount >= 0 && cfg.defaultDiscount < 1)
    DEFAULT_WHOLESALE_DISCOUNT = cfg.defaultDiscount;
  try { window.localStorage.setItem(KEY_CONFIG, JSON.stringify({ threshold: WHOLESALE_THRESHOLD, defaultDiscount: DEFAULT_WHOLESALE_DISCOUNT })); } catch {}
}

// hidrata config do localStorage no boot (antes do GET responder)
try {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY_CONFIG) : null;
  if (raw) applyConfig(JSON.parse(raw));
} catch { /* ignore */ }

export async function loadWholesaleFromBackend(): Promise<boolean> {
  try {
    const { data } = await api.get<WholesalePayload>("/wholesale");
    applyConfig(data.config);
    if (data.categories) writeJson(KEY_CATEGORY, data.categories);
    if (data.products) writeJson(KEY_PRODUCT, data.products);
    window.dispatchEvent(new CustomEvent("wholesale:changed"));
    return true;
  } catch {
    return false;
  }
}

export async function saveCategoryWholesale(category: WholesaleCategory, price: number | null) {
  try {
    if (price == null) await api.delete(`/wholesale/category/${category}`);
    else await api.put("/wholesale/category", { category, price });
  } catch (err) {
    setCategoryWholesale(category, price); // mantém cache local
    throw err;
  }
  setCategoryWholesale(category, price);
}

export async function saveProductWholesale(productId: string | number, price: number | null) {
  try {
    if (price == null) await api.delete(`/wholesale/product/${productId}`);
    else await api.put("/wholesale/product", { productId, price });
  } catch (err) {
    setProductWholesale(productId, price);
    throw err;
  }
  setProductWholesale(productId, price);
}

export async function saveWholesaleConfig(cfg: { threshold?: number; defaultDiscount?: number }) {
  await api.put("/wholesale/config", cfg);
  applyConfig(cfg);
  window.dispatchEvent(new CustomEvent("wholesale:changed"));
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
