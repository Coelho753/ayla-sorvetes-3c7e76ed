import { api } from "./api";

export type Category =
  | "tub" | "cup" | "popsicle" | "acai"
  | "pote" | "pic_agua" | "pic_leite" | "pic_premium" | "pic_ski";

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
  popsiclesAgua: ApiProduct[];
  popsiclesLeite: ApiProduct[];
  popsiclesPremium: ApiProduct[];
  popsiclesSki: ApiProduct[];
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
  const out: GroupedProducts = {
    tub: [], cup: [], popsicle: [], acai: [],
    popsiclesAgua: [], popsiclesLeite: [], popsiclesPremium: [], popsiclesSki: [],
  };
  for (const p of list) {
    const c = (p.category ?? "").toString().toLowerCase();
    if (c === "tub" || c === "pote") out.tub.push(p);
    else if (c === "cup" || c === "copo") out.cup.push(p);
    else if (c === "pic_agua") { out.popsiclesAgua.push(p); out.popsicle.push(p); }
    else if (c === "pic_leite") { out.popsiclesLeite.push(p); out.popsicle.push(p); }
    else if (c === "pic_premium") { out.popsiclesPremium.push(p); out.popsicle.push(p); }
    else if (c === "pic_ski") { out.popsiclesSki.push(p); out.popsicle.push(p); }
    else if (c === "popsicle" || c === "picole" || c === "picolé") out.popsicle.push(p);
    else if (c === "acai" || c === "açaí") out.acai.push(p);
  }
  return out;
}

export function imgOf(p: ApiProduct): string | undefined {
  const v = p.image ?? p.imageUrl;
  if (v && v.trim()) return v;
  return undefined;
}
