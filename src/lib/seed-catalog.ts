import { api } from "./api";
import seed from "@/data/seed-products.json";

export type SeedProduct = {
  name: string;
  category: string;
  price: number;
  size?: string;
  image?: string;
  stock?: number;
  active?: boolean;
  description?: string;
};

export const seedProducts = seed as SeedProduct[];

const norm = (s: string) => s.toLowerCase().trim();
const keyOf = (p: { name: string; category?: string }) => `${norm(p.category ?? "")}::${norm(p.name)}`;

export type SeedResult = { created: number; updated: number; failed: number; errors: string[] };

/**
 * Faz upsert de todo o catálogo local no backend (requer sessão de admin).
 * Chama onProgress(feitos, total) a cada item.
 */
export async function seedCatalog(onProgress?: (done: number, total: number) => void): Promise<SeedResult> {
  const result: SeedResult = { created: 0, updated: 0, failed: 0, errors: [] };

  const existing = new Map<string, string>();
  try {
    const { data } = await api.get<unknown>("/products");
    const list = (Array.isArray(data) ? data : ((data as { data?: unknown[] })?.data ?? [])) as Array<
      Record<string, unknown>
    >;
    for (const p of list) {
      const id = (p["id"] ?? p["_id"]) as string | undefined;
      const name = p["name"] as string | undefined;
      if (id && name) existing.set(keyOf({ name, category: p["category"] as string | undefined }), id);
    }
  } catch {
    /* sem lista prévia — tudo será criado */
  }

  const total = seedProducts.length;
  let done = 0;
  for (const product of seedProducts) {
    const id = existing.get(keyOf(product));
    try {
      if (id) {
        await api.put(`/products/${id}`, product);
        result.updated++;
      } else {
        await api.post("/products", product);
        result.created++;
      }
    } catch (err) {
      result.failed++;
      if (result.errors.length < 5) {
        const msg = (err as { response?: { status?: number } })?.response?.status ?? "erro";
        result.errors.push(`${product.name} (${product.category}): ${msg}`);
      }
    }
    done++;
    onProgress?.(done, total);
  }
  return result;
}
