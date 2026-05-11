/**
 * Seed: envia todos os produtos do fallback para o backend.
 *
 * Como rodar:
 *   1. Faça login como admin no site, copie o accessToken (DevTools > localStorage).
 *   2. export ADMIN_TOKEN="cole_o_token_aqui"
 *   3. bun scripts/seed-products.ts
 *
 * Variáveis opcionais:
 *   API_URL     (default: https://sorveteria-b.onrender.com)
 *   DRY_RUN=1   (apenas mostra o que enviaria)
 */
import seed from "./seed-products.json" with { type: "json" };

const API_URL = process.env.API_URL ?? "https://sorveteria-b.onrender.com";
const TOKEN = process.env.ADMIN_TOKEN;
const DRY = process.env.DRY_RUN === "1";

if (!TOKEN && !DRY) {
  console.error("❌ ADMIN_TOKEN não definido. Use DRY_RUN=1 para simular.");
  process.exit(1);
}

let ok = 0, fail = 0;
for (const product of seed as Array<Record<string, unknown>>) {
  if (DRY) { console.log("DRY →", product.name); ok++; continue; }
  try {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      console.error(`❌ ${product.name}: HTTP ${res.status} — ${await res.text()}`);
      fail++;
    } else {
      console.log(`✅ ${product.name}`);
      ok++;
    }
  } catch (e) {
    console.error(`❌ ${product.name}: ${(e as Error).message}`);
    fail++;
  }
}
console.log(`\n✨ Concluído: ${ok} ok, ${fail} falhas.`);
