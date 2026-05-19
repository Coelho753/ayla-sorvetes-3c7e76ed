# 🔐 Mudanças OBRIGATÓRIAS no Backend — Ayla Sorvetes

Frontend já recebeu hardening (headers de segurança, CSP, validação forte de senha,
sanitização de URL/imagem, filtro de erros internos). Mas várias proteções só
funcionam se o **backend** (`sorveteria-b.onrender.com`) também for atualizado.

Lista priorizada do que deve ser feito no servidor.

---

## 🔴 CRÍTICO — fazer antes de publicar

### 1. Migrar tokens JWT para cookie HttpOnly
Hoje o frontend guarda `accessToken`/`refreshToken` em `localStorage`. Qualquer XSS
rouba a conta. Solução:
- `/auth/login`, `/auth/register`, `/auth/refresh` devem responder com:
  ```
  Set-Cookie: ayla_at=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900
  Set-Cookie: ayla_rt=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=2592000
  ```
- Aceitar Authorization Bearer **OU** cookie. Quando estiver pronto, o frontend
  troca o axios para `withCredentials: true` e remove o `tokenStorage`.
- `accessToken` ≤ 15 min, `refreshToken` com **rotação** (cada refresh emite novo
  refresh e invalida o anterior; manter blocklist).

### 2. Rate limiting nas rotas sensíveis
Sem isto, brute-force de senha e spam de cadastro são triviais.
```js
import rateLimit from "express-rate-limit";
app.use("/auth/login",    rateLimit({ windowMs: 60_000, max: 5  }));
app.use("/auth/register", rateLimit({ windowMs: 60*60_000, max: 3 }));
app.use("/auth/refresh",  rateLimit({ windowMs: 60_000, max: 30 }));
app.use("/orders",        rateLimit({ windowMs: 60_000, max: 20 }));
```

### 3. CORS restrito
Trocar `cors()` aberto por allowlist explícita:
```js
app.use(cors({
  origin: ["https://aylasorvetes.com.br", "https://<seu-dominio-lovable>.lovable.app"],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE"],
}));
```
Nunca usar `*` quando habilitar cookie (`credentials: true`).

### 4. Promover admin SOMENTE no banco
- Manter rejeição explícita do campo `role` em `/auth/register` e `PUT /users/me`.
- Criar `PATCH /admin/users/:id/role` com middleware `requireRole("admin")` + log.
- Promover manualmente:
  ```js
  db.users.updateOne({ email: "ayla@admin.com" }, { $set: { role: "admin" } })
  ```

### 5. Validar role no servidor em TODA rota admin
`/admin/*`, `/orders` (listagem), `/wholesale/*` (PUT/DELETE), `/financeiro/*` —
todas exigem `requireAuth + requireRole("admin")`. **Nunca** confiar no `role`
que o cliente envia.

### 6. Validação Zod/Joi em TODO body
Cap de tamanho em strings, regex onde fizer sentido. Exemplo `/auth/register`:
```js
const RegisterSchema = z.object({
  name:  z.string().min(2).max(120).regex(/^[^<>{}$`\\]+$/),
  email: z.string().email().max(255).toLowerCase(),
  senha: z.string().min(10).max(100)
           .regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  endereco: z.object({
    cep: z.string().regex(/^\d{5}-?\d{3}$/),
    rua: z.string().min(2).max(120),
    numero: z.string().min(1).max(10),
    bairro: z.string().min(2).max(80),
    cidade: z.string().min(2).max(80),
    estado: z.string().length(2),
    complemento: z.string().max(60).optional(),
  }).optional(),
}).strict(); // <-- bloqueia campos extras (ex.: role)
```

### 7. Hash de senha forte
`bcrypt` com cost ≥ 12, ou `argon2id`. Nunca SHA-256/MD5.
```js
import bcrypt from "bcrypt";
const hash = await bcrypt.hash(password, 12);
```

### 8. Mensagens de erro genéricas
Erros internos do servidor (`secretOrPrivateKey`, stack traces, paths) **nunca**
devem ir no body da resposta. Logue no servidor, responda
`{ message: "Erro interno" }` com status 500.
```js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ message: err.expose ? err.message : "Erro interno" });
});
```

---

## 🟠 ALTO — sprint seguinte

### 9. CAPTCHA no login após 3 falhas
hCaptcha ou Cloudflare Turnstile. Block IP por 15 min após 10 falhas.

### 10. Verificar senha vazada (HIBP)
Em `/auth/register` e troca de senha, consultar Pwned Passwords (k-anonymity, só
os 5 primeiros chars do SHA-1):
```js
const prefix = sha1(password).slice(0,5);
const list = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`).then(r=>r.text());
if (list.includes(sha1(password).slice(5).toUpperCase())) {
  throw new Error("Senha encontrada em vazamentos. Escolha outra.");
}
```

### 11. Webhook do WhatsApp protegido
A rota `POST /orders/whatsapp` (criar pedido externo) **precisa** validar HMAC:
```js
const sig = req.headers["x-ayla-signature"];
const expected = crypto.createHmac("sha256", process.env.WA_WEBHOOK_SECRET)
                       .update(rawBody).digest("hex");
if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
  return res.status(401).end();
```

### 12. Recalcular preço de atacado no servidor
Cliente envia `items`; servidor **ignora** `price` recebido e recalcula a partir
de `wholesale_config` + `wholesale_category_prices`. Caso contrário um usuário
pode forjar preço 0.

### 13. Auditoria de ações admin
Tabela `admin_audit` com `{ user_id, action, payload, ip, ua, ts }` para toda
rota `/admin/*`.

---

## 🟡 MÉDIO — hardening adicional

- **14.** `helmet()` no Express (CSP, HSTS, frameguard, noSniff já vêm prontos).
- **15.** Encryption-at-rest no MongoDB Atlas (já incluso no plano pago).
- **16.** Mascarar PII em logs (`email`, `cep`, `telefone`).
- **17.** Sanitizar `name`/`description` de produto (`/admin/products`) — sem `<script>`.
- **18.** Restringir `Content-Type: application/json` em POST/PUT (rejeitar formulário).
- **19.** Limite de tamanho de body: `express.json({ limit: "32kb" })`.
- **20.** Allowlist de hosts de imagem em `product.image` (só CDN próprio + Cloudinary).

---

## 🟢 BAIXO — operacional

- **21.** `npm audit --omit=dev` no CI; falha o deploy em High/Critical.
- **22.** Snyk / Dependabot ligados no repo.
- **23.** Backup diário do Mongo + teste de restore mensal.
- **24.** Logs centralizados (Render Logs → Better Stack / Logtail).
- **25.** Monitor de saúde + alerta no WhatsApp do admin se `/health` cair.

---

## ✅ Já feito no FRONTEND

- Headers de segurança em **toda** resposta do `server.js` (CSP estrita, HSTS,
  X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, X-Content-Type-Options,
  COOP).
- Política de senha forte no cadastro (≥10, maiúscula+minúscula+número).
- Validação Zod com regex anti-injeção em todos os campos do cadastro.
- `safeImageUrl()` bloqueia `javascript:`, `file:`, `blob:` em `<img>`.
- `extractApiError()` filtra `secretOrPrivateKey`, stack traces e paths internos.
- Todos `target="_blank"` com `rel="noopener noreferrer"`.
- `encodeURIComponent` em todas as mensagens enviadas para WhatsApp.
- `maxLength` em todos os inputs do cadastro.

---

## ⚠️ Ainda em aberto no frontend (depende do backend)

- **Tokens em cookie HttpOnly** — só depois que o backend emitir o `Set-Cookie`.
  Quando isso estiver pronto, remover `tokenStorage` e setar `withCredentials: true`
  no axios.
- **CSP sem `'unsafe-inline'` em script-src** — exige refatorar para nonce/hash
  nos scripts inline do TanStack SSR.

---

**Resumo prático para mandar pro dev do backend:**
1. Cookie HttpOnly + rotação de refresh.
2. Rate limit em `/auth/*` e `/orders`.
3. CORS allowlist + `credentials: true`.
4. Zod `.strict()` em todo body, recusando campo `role`.
5. `requireRole("admin")` em toda rota admin.
6. Erros genéricos no client, log completo no servidor.
7. Recalcular preço de atacado no servidor (não confiar no `price` do client).
8. HMAC no webhook `/orders/whatsapp`.