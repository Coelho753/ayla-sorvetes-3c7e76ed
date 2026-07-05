// Servidor estático mínimo para hospedagem no Render (Node runtime).
// Serve o build do Vite (dist/client) e faz fallback SPA para index.html.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "dist", "client");
const PORT = Number(process.env.PORT) || 10000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function safeJoin(base, target) {
  const p = path.normalize(path.join(base, target));
  if (!p.startsWith(base)) return null;
  return p;
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const headers = { "Content-Type": type };
  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else {
    headers["Cache-Control"] = "public, max-age=0, must-revalidate";
  }
  fs.createReadStream(filePath)
    .on("open", () => res.writeHead(200, headers))
    .on("error", () => send(res, 500, { "Content-Type": "text/plain" }, "Internal error"))
    .pipe(res);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/health") return send(res, 200, { "Content-Type": "application/json" }, '{"ok":true}');
    const rel = decodeURIComponent(url.pathname);
    const filePath = safeJoin(ROOT, rel);
    if (!filePath) return send(res, 400, {}, "Bad request");
    fs.stat(filePath, (err, stat) => {
      if (!err && stat.isFile()) return serveFile(filePath, res);
      // SPA fallback
      const indexPath = path.join(ROOT, "index.html");
      fs.stat(indexPath, (e2, s2) => {
        if (e2 || !s2.isFile()) return send(res, 404, { "Content-Type": "text/plain" }, "Not built. Run `npm run build`.");
        serveFile(indexPath, res);
      });
    });
  } catch {
    send(res, 500, { "Content-Type": "text/plain" }, "Internal error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Ayla Sorvetes rodando em http://0.0.0.0:${PORT}`);
});
