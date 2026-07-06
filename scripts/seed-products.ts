/**
 * Seed: envia todos os produtos do JSON para o backend.
 * Faz UPSERT por (name + category): se existir, faz PUT; senão POST.
 *
 * Como rodar:
 *   1. Faça login como admin no site, copie o accessToken.
 *   2. export ADMIN_TOKEN="cole_o_token_aqui"
 *   3. bun scripts/seed-products.ts
 *
 * Variáveis opcionais:
 *   API_URL      (default: https://sorveteria-b-m8k4.onrender.com)
 *   IMAGE_BASE   prefixo para o campo `image` (ex.: https://meusite.com)
 *   DRY_RUN=1    apenas mostra o que enviaria
 */
import seed from "./seed-products.json" with { type: "json" };

const API_URL = process.env.API_URL ?? "https://sorveteria-b-m8k4.onrender.com";
const IMAGE_BASE = process.env.IMAGE_BASE ?? "";
const TOKEN = process.env.ADMIN_TOKEN;
const DRY = process.env.DRY_RUN === "1";

if (!TOKEN && !DRY) {
  console.error("❌ ADMIN_TOKEN não definido. Use DRY_RUN=1 para simular.");
  process.exit(1);
}

const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` };
const norm = (s: string) => s.toLowerCase().trim();
const keyOf = (p: { name: string; category: string }) => `${norm(p.category)}::${norm(p.name)}`;

type Existing = { _id?: string; id?: string; name: string; category: string };
let existing = new Map<string, string>();
if (!DRY) {
  const res = await fetch(`${API_URL}/products`);
  if (res.ok) {
    const list = (await res.json()) as Existing[] | { data: Existing[] };
    const arr = Array.isArray(list) ? list : list.data ?? [];
    for (const p of arr) {
      const id = p._id ?? p.id;
      if (id) existing.set(keyOf(p as { name: string; category: string }), id);
    }
    console.log(`📚 ${existing.size} produtos existentes no backend.`);
  } else {
    console.warn(`⚠️  Não consegui listar existentes (HTTP ${res.status}); tudo será POST.`);
  }
}

let created = 0, updated = 0, fail = 0;
for (const raw of seed as Array<Record<string, unknown>>) {
  const product = { ...raw } as Record<string, unknown>;
  if (IMAGE_BASE && typeof product.image === "string") product.image = IMAGE_BASE + product.image;
  const name = product.name as string;
  const category = product.category as string;
  const id = existing.get(keyOf({ name, category }));
  const method = id ? "PUT" : "POST";
  const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
  if (DRY) { console.log(`DRY ${method} → ${name} (${category})`); continue; }
  try {
    const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(product) });
    if (!res.ok) { console.error(`❌ ${name}: HTTP ${res.status} — ${await res.text()}`); fail++; }
    else { id ? updated++ : created++; console.log(`${id ? "🔄" : "✅"} ${name}`); }
  } catch (e) {
    console.error(`❌ ${name}: ${(e as Error).message}`);
    fail++;
  }
}
console.log(`\n✨ Concluído: ${created} criados, ${updated} atualizados, ${fail} falhas.`);
