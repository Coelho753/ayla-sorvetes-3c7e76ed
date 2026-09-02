// Gera dist/client/index.html a partir do bundle SSR (dist/server).
// Sem isso, o deploy estático (Render) não encontra o index.html e cai na
// mensagem "Build não encontrado".
import fs from "node:fs";
import path from "node:path";

const CLIENT_DIR = path.resolve("dist/client");
const OUT = path.join(CLIENT_DIR, "index.html");

async function main() {
  if (!fs.existsSync(path.resolve("dist/server/index.mjs"))) {
    console.error("[prerender] dist/server/index.mjs não encontrado — rode o build antes.");
    process.exit(1);
  }
  const mod = await import(path.resolve("dist/server/index.mjs"));
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
  fs.mkdirSync(CLIENT_DIR, { recursive: true });
  fs.writeFileSync(OUT, html);
  console.log(`[prerender] index.html gerado (${(html.length / 1024).toFixed(1)} kB)`);
}

main().catch((err) => {
  console.error("[prerender] falhou:", err);
  process.exit(1);
});
