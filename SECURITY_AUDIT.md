# 🔐 Auditoria de Segurança — Ayla Sorvetes

Relatório dos pontos de risco identificados no **frontend** (React/TanStack) e no **backend** (`https://sorveteria-b.onrender.com`), com gravidade e correções recomendadas.

---

## 🔴 Críticos

### 1. Tokens JWT em `localStorage` (frontend)
**Onde:** `src/lib/api.ts` → `tokenStorage` salva `accessToken`/`refreshToken` em `localStorage`.
**Risco:** Qualquer XSS (script injetado, dependência comprometida, extensão maliciosa) lê os tokens e sequestra a conta.
**Como corrigir:**
- Backend deve emitir o token em **cookie HttpOnly + Secure + SameSite=Lax/Strict** e o frontend só envia `withCredentials: true`. Assim JS nunca toca no token.
- Reduzir tempo de vida do `accessToken` (≤15 min) e usar refresh rotativo.
- Configurar **CSP** estrita no `index.html`/headers (`default-src 'self'`).

### 2. Promoção de role pelo cliente (backend)
**Onde:** `POST /auth/register` aceita campo `role`. O backend hoje **ignora** (✅ bom), mas não há endpoint admin auditado para promover usuários.
**Risco:** Se algum dia alguém aceitar `role` no body, qualquer um vira admin.
**Como corrigir:**
- Manter rejeição explícita de `role` em register/update.
- Criar `PATCH /admin/users/:id/role` exigindo middleware `requireRole('admin')` + log de auditoria.
- A conta `ayla@admin.com` foi criada como `user` — **promover manualmente no Mongo** (`db.users.updateOne({email:"ayla@admin.com"},{$set:{role:"admin"}})`).

### 3. Verificação de admin sem checagem do servidor
**Onde:** `AuthContext.tsx` → `isAdmin: user?.role === "admin"` confia no `role` retornado por `/users/me`.
**Risco:** Se um atacante alterar a resposta (MITM em rede insegura) ou injetar no `localStorage`, o frontend libera tela `/admin`. As ações ainda batem no backend, mas a UI vazada pode revelar fluxos.
**Como corrigir:**
- Garantir HTTPS estrito (HSTS no backend).
- **O backend é a fonte da verdade** — toda rota admin deve revalidar o JWT e o role no servidor (assumir que sim, mas confirmar em cada endpoint sensível).
- Não exibir dados sensíveis na UI sem antes o servidor confirmar permissão.

### 4. CORS permissivo (provável)
**Onde:** Backend Render — não vimos a config, mas APIs públicas costumam usar `*`.
**Risco:** Outros sites podem chamar a API com cookies do usuário (se migrar para cookie) ou abusar dos endpoints públicos.
**Como corrigir:** restringir `Access-Control-Allow-Origin` ao domínio publicado (Lovable, custom domain) e desabilitar `*` quando `credentials: true`.

---

## 🟠 Altos

### 5. Sem rate limit em `/auth/login` e `/auth/register`
**Risco:** Brute-force de senhas e criação massiva de contas (spam).
**Correção:** middleware `express-rate-limit` (ex.: 5 tentativas/min/IP em login, 3 registros/hora/IP), CAPTCHA no frontend após 3 falhas.

### 6. Sem política de senha forte
**Onde:** `src/routes/cadastro.tsx` (provavelmente) e backend — não há mínimo enforced além do que o usuário digita.
**Correção:**
- Exigir ≥10 caracteres, mistura de classes, bloquear senhas vazadas (HaveIBeenPwned k-anonymity).
- Hash com **bcrypt cost ≥12** ou **argon2id** no backend (confirmar).

### 7. Falta de proteção CSRF se migrar para cookies
**Correção:** quando passar para cookie HttpOnly, adicionar token CSRF (double-submit ou sameSite=Strict + header customizado).

### 8. Logs/erros expondo `secretOrPrivateKey`
**Onde:** já tratado no `AuthContext` (`/secretOrPrivateKey/i.test(msg)`), o que indica que o backend já vazou esse erro em produção.
**Correção:** backend nunca deve retornar mensagens internas — sempre `{ message: "Erro interno" }` + log no servidor.

---

## 🟡 Médios

### 9. Endereço e dados pessoais sem criptografia em repouso
**Correção:** ativar encryption-at-rest no MongoDB Atlas e mascarar PII em logs.

### 10. `WHATSAPP_LINK` exposto e mensagens não escapadas
**Onde:** `src/lib/whatsapp.ts` monta URL com dados do carrinho.
**Risco baixo:** envenenamento de URL se algum nome de produto vier do backend com `?` ou `#`.
**Correção:** `encodeURIComponent` em cada campo (provavelmente já feito — confirmar).

### 11. Imagens de produto vindas do backend sem validação
**Correção:** sanitizar URL no frontend (`https://` apenas) e permitir só hosts confiáveis (CDN próprio).

### 12. Sem CSP / Permissions-Policy / X-Frame-Options
**Correção:** adicionar headers no `server.js` ou `wrangler.jsonc`:
```
Content-Security-Policy: default-src 'self'; img-src 'self' https: data:; ...
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 13. Refresh token sem rotação/revogação visível
**Correção:** ao usar `/auth/refresh`, emitir novo refresh e invalidar o anterior; manter blocklist em Redis.

---

## 🟢 Baixos / hardening

- **14.** Adicionar `noopener noreferrer` em todos `target="_blank"` (verificar `WhatsAppFloat`, `SiteHeader`).
- **15.** Sanitizar inputs em `/admin` ao criar produto (`name`, `description`) com DOMPurify se algum dia renderizar como HTML.
- **16.** Remover `console.log` em produção (configurar Vite `drop_console`).
- **17.** `.env` / `LOVABLE_API_KEY` — nunca expor no client (usar apenas em server functions).
- **18.** Auditoria de dependências: rodar `bun audit` / `npm audit` no CI.
- **19.** Backup regular do Mongo + teste de restauração.

---

## ✅ Já está bom

- Refresh token + retry no axios.
- Backend rejeita `role` no register.
- Senha não trafega em GET; usa POST + HTTPS.
- Tokens não vão como query string.

---

## Resumo prático

**Fazer agora:**
1. Migrar tokens para **cookie HttpOnly** (backend + axios `withCredentials`).
2. Adicionar **rate limit** em `/auth/*`.
3. Adicionar **headers de segurança** (CSP, HSTS, etc.).
4. Promover `ayla@admin.com` no Mongo manualmente:
   ```js
   db.users.updateOne({ email: "ayla@admin.com" }, { $set: { role: "admin" } })
   ```

**Próximo sprint:**
5. CAPTCHA no login após 3 falhas.
6. Política de senha + bloqueio de senhas vazadas.
7. Logs sem PII e sem stack traces para o cliente.
