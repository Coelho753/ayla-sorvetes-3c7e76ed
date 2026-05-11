import { api } from "./api";

export type Category = "tub" | "cup" | "popsicle" | "acai";

export type ApiProduct = {
  id: string | number;
  name: string;
  price: number | string;
  description?: string;
  image?: string;
  imageUrl?: string;
  category?: Category | string;
  size?: string;
  active?: boolean;
};

export type GroupedProducts = {
  tub: ApiProduct[];
  cup: ApiProduct[];
  popsicle: ApiProduct[];
  acai: ApiProduct[];
};

export async function fetchProducts(): Promise<ApiProduct[] | null> {
  try {
    const { data } = await api.get<ApiProduct[] | { data: ApiProduct[] }>("/products");
    const list = Array.isArray(data) ? data : (data as { data: ApiProduct[] }).data ?? [];
    return list.filter((p) => p.active !== false);
  } catch {
    return null; // backend offline / sem auth — front usa fallback local
  }
}

export function groupByCategory(list: ApiProduct[]): GroupedProducts {
  const out: GroupedProducts = { tub: [], cup: [], popsicle: [], acai: [] };
  for (const p of list) {
    const c = (p.category ?? "").toString().toLowerCase();
    if (c === "tub" || c === "pote") out.tub.push(p);
    else if (c === "cup" || c === "copo") out.cup.push(p);
    else if (c === "popsicle" || c === "picole" || c === "picolé") out.popsicle.push(p);
    else if (c === "acai" || c === "açaí") out.acai.push(p);
  }
  return out;
}

export function imgOf(p: ApiProduct): string | undefined {
  return p.image ?? p.imageUrl;
}
