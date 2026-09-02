// Gera o index.html a partir do bundle SSR.
// O output pode estar em dist/ (local) ou .output/ (Render/Nitro) — suporta os dois.
import fs from "node:fs";
import path from "node:path";

const CANDIDATES = [
  { server: "dist/server/index.mjs", client: "dist/client" },
  { server: ".output/server/index.mjs", client: ".output/public" },
];

async function main() {
  const target = CANDIDATES.find((c) => fs.existsSync(path.resolve(c.server)));
  if (!target) {
    console.error("[prerender] bundle SSR não encontrado em dist/server nem .output/server.");
    process.exit(1);
  }
  const mod = await import(path.resolve(target.server));
  const handler = mod.default?.fetch ?? mod.default;
  const res = await handler(new Request("http://localhost/"), {}, {
    waitUntil() {},
    passThroughOnException() {},
  });
  if (!res.ok) {
    console.error(`[prerender] SSR respondeu ${res.status}`);
    process.exit(1);
  }
  const html = await res.text();
  if (!html.includes("</html>") || html.length < 1000) {
    console.error("[prerender] HTML incompleto — abortando.");
    process.exit(1);
  }
  const clientDir = path.resolve(target.client);
  fs.mkdirSync(clientDir, { recursive: true });
  fs.writeFileSync(path.join(clientDir, "index.html"), html);
  console.log(`[prerender] ${target.client}/index.html gerado (${(html.length / 1024).toFixed(1)} kB)`);
}

main().catch((err) => {
  console.error("[prerender] falhou:", err);
  process.exit(1);
});
