# 🛒 Backend — Produtos, Pedidos (WhatsApp), Usuários e Fidelidade

A API do site está em `https://sorveteria-b.onrender.com`. O front consome 4 recursos: **products**, **orders**, **users** e **fidelidade (loyalty)**. Tudo o que o painel `/admin` precisa está documentado abaixo.

> **Atualização — Programa Fidelidade Clube Ayla.** A cada **10 potes comprados e entregues**, o usuário ganha **1 pote grátis**. Isso requer 4 campos novos no banco e mudanças em `PUT /orders/:id`. Veja a seção **6. Fidelidade** ao final.

---

## 1. Produtos (`/products`)

### Schema
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `id` | uuid / int | ✅ | gerado |
| `name` | string | ✅ | nome do sabor |
| `price` | number | ✅ | em R$ |
| `description` | string | ❌ | |
| `image` | string (URL) | ❌ | URL pública |
| `category` | enum | ✅ | `tub` \| `cup` \| `popsicle` \| `acai` |
| `size` | string | ❌ | só p/ açaí: `1L`, `5L`, `300ml`, `Picolé` |
| `active` | boolean | ❌ | default `true` (false esconde da home) |
| `createdAt` | datetime | ❌ | |

### Endpoints
```
GET    /products           público
POST   /products           admin
PUT    /products/:id       admin
DELETE /products/:id       admin
```

Resposta de `GET` aceita `Product[]` ou `{ data: Product[] }`.

### Seed
```bash
export ADMIN_TOKEN="cole_o_accessToken_aqui"
bun scripts/seed-products.ts
```

---

## 2. Pedidos (`/orders`)

### Schema
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `id` | uuid / int | ✅ | gerado |
| `userId` | ref users | ❌ | null em pedidos de WhatsApp sem cadastro |
| `customerName` | string | ❌ | nome livre (usado em pedidos WhatsApp) |
| `customerPhone` | string | ❌ | telefone do cliente |
| `items` | json[] | ✅ | `{ productId?, name, quantity, price }` |
| `total` | number | ✅ | soma de `quantity*price` |
| `address` | json | ❌ | `{ street, number, city, ... }` |
| `status` | enum | ✅ | `pendente` \| `pago` \| `preparando` \| `enviado` \| `entregue` \| `cancelado` |
| `source` | enum string | ✅ | `site` \| `whatsapp` (default `site`) |
| `createdAt` | datetime | ❌ | |

### Endpoints
```
GET    /orders                  admin (todos)
GET    /orders?source=whatsapp  admin (filtro p/ aba WhatsApp)
GET    /orders/me               usuário (próprios pedidos)
POST   /orders                  usuário (cria do site)
POST   /orders/whatsapp         público OU webhook (cria pedido com source="whatsapp")
PUT    /orders/:id              admin (mudar status)
DELETE /orders/:id              admin
```

### Como popular pedidos do WhatsApp
Você tem 3 caminhos:

**A) Manual via painel admin** — adicione um endpoint `POST /orders/whatsapp` com payload:
```json
{
  "customerName": "Maria",
  "customerPhone": "+55 11 91234-5678",
  "items": [{ "name": "Pote Chocolate 1,5L", "quantity": 2, "price": 35 }],
  "total": 70,
  "source": "whatsapp",
  "status": "pendente"
}
```

**B) Webhook do WhatsApp Business / API** — assine os eventos de mensagem e, ao detectar palavras-chave (ex.: "pedido", lista de sabores), chame `POST /orders/whatsapp` internamente.

**C) Bot intermediário** (n8n, Twilio, Z-API) — converta a conversa em JSON e POSTe no endpoint acima.

> O front (`/admin → aba WhatsApp`) lista esses pedidos automaticamente filtrando por `source="whatsapp"`. Se a API ignorar a query string `?source=`, o front também filtra no client.

---

## 3. Usuários (`/users`)

### Schema
| Campo | Tipo | Obrigatório |
|---|---|---|
| `id` | uuid / int | ✅ |
| `name` | string | ❌ |
| `email` | string (unique) | ✅ |
| `passwordHash` | string | ✅ (nunca retornar) |
| `phone` | string | ❌ |
| `role` | enum | ✅ — `user` \| `admin` (default `user`) |
| `createdAt` | datetime | ❌ |

### Endpoints
```
POST   /auth/register     público — sempre cria como role="user"
POST   /auth/login        público
POST   /auth/refresh      público
GET    /auth/me           usuário autenticado
GET    /users             admin (lista todos)
PUT    /users/:id         admin (mudar role, name, phone)
DELETE /users/:id         admin
```

⚠️ **Segurança**: `POST /auth/register` NUNCA deve aceitar `role` no body. Promoção a admin só pelo endpoint `PUT /users/:id` autenticado como admin.

### Promover um usuário a admin (uma vez, no banco)
```js
db.users.updateOne({ email: "ayla@admin.com" }, { $set: { role: "admin" } })
```
Depois disso, o próprio admin promove outros pela aba **Usuários** do painel.

---

## 4. Permissões (resumo)

| Endpoint | Anônimo | User | Admin |
|---|:-:|:-:|:-:|
| `GET /products` | ✅ | ✅ | ✅ |
| `POST/PUT/DELETE /products` | ❌ | ❌ | ✅ |
| `POST /orders` | ❌ | ✅ | ✅ |
| `POST /orders/whatsapp` | ✅ (webhook c/ secret) | — | ✅ |
| `GET /orders` | ❌ | ❌ | ✅ |
| `GET /orders/me` | ❌ | ✅ | ✅ |
| `PUT/DELETE /orders/:id` | ❌ | ❌ | ✅ |
| `GET/PUT/DELETE /users` | ❌ | ❌ | ✅ |

---

## 5. Fallback no front

Quando `/products` retorna vazio ou offline, a home usa `src/lib/catalog.ts`. Quando o backend tem dados, eles têm prioridade.

---

## 6. Fidelidade — Clube Ayla (10 potes = 1 grátis)

### Schema `users` — adicionar
| Campo | Tipo | Default | Observação |
|---|---|---|---|
| `loyaltyStamps` | int | 0 | Selos acumulados desde o último resgate (0–9) |
| `loyaltyCredits` | int | 0 | Potes grátis disponíveis para resgate |

### Schema `orders` — adicionar
| Campo | Tipo | Default | Observação |
|---|---|---|---|
| `loyaltyCreditsUsed` | int | 0 | Nº de créditos aplicados neste pedido (geralmente 0 ou 1) |
| `loyaltyStampsEarned` | int | 0 | Quantos selos este pedido gerou. Preenchido apenas quando o pedido vira `entregue` (idempotência) |

### Lógica em `PUT /orders/:id` (admin muda status)

```pseudo
old = order.status
new = req.body.status

if new == "entregue" and order.loyaltyStampsEarned == 0:
    potes = sum(item.quantity for item in order.items if product[item.id].category == "tub")
    user.loyaltyStamps += potes
    while user.loyaltyStamps >= 10:
        user.loyaltyStamps -= 10
        user.loyaltyCredits += 1
    order.loyaltyStampsEarned = potes
    save(user, order)

if new == "cancelado" and old == "entregue" and order.loyaltyStampsEarned > 0:
    # reverter
    user.loyaltyStamps -= order.loyaltyStampsEarned
    while user.loyaltyStamps < 0:
        user.loyaltyStamps += 10
        user.loyaltyCredits -= 1   # se ficar negativo, bloquear/avisar
    order.loyaltyStampsEarned = 0
    save(user, order)
```

### Em `POST /orders`
- Aceitar `loyaltyCreditsUsed` no body.
- Validar `user.loyaltyCredits >= loyaltyCreditsUsed`.
- Debitar imediatamente: `user.loyaltyCredits -= loyaltyCreditsUsed`.
- Se o pedido for cancelado **antes** de virar `entregue`, devolver: `user.loyaltyCredits += order.loyaltyCreditsUsed`.

### Endpoints novos / atualizados

```
GET /users/me/loyalty   → { stamps: 7, credits: 1, nextRewardIn: 3 }   (opcional, mas útil)
GET /users/me           → DEVE incluir loyaltyStamps + loyaltyCredits
GET /users              → DEVE incluir loyaltyStamps + loyaltyCredits
GET /users/:id          → admin (já implícito em /users mas o front usa /:id também)
PUT /users/:id          → DEVE aceitar { name, phone, role, address, loyaltyStamps, loyaltyCredits }
GET /orders?userId=ID   → admin: pedidos de um usuário (o front filtra no client se ignorado)
GET /orders?from=ISO&to=ISO → admin: filtro por data (opcional, otimização)
```

### Permissões
| Endpoint | Anônimo | User | Admin |
|---|:-:|:-:|:-:|
| `GET /users/me/loyalty` | ❌ | ✅ | ✅ |
| `GET /users/:id` | ❌ | ❌ | ✅ |

---

## 7. Criação do usuário admin (ayla@admin.com)

⚠️ **Não enviar a senha em texto plano por chat/email.** Use uma destas opções:

### Opção A — Cadastrar pelo site e promover
1. Acesse `/cadastro` no site e registre `ayla@admin.com` com a senha desejada.
2. No shell do banco (Render → Shell ou MongoDB Compass):
   ```js
   // Mongo
   db.users.updateOne({ email: "ayla@admin.com" }, { $set: { role: "admin" } })
   ```
   ```sql
   -- Postgres
   UPDATE users SET role = 'admin' WHERE email = 'ayla@admin.com';
   ```
3. Pronto. Login pelo `/login` normal.

### Opção B — Criar diretamente no banco
Quem tiver acesso ao backend roda localmente:
```js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(SENHA_AQUI, 10);
db.users.insertOne({
  name: "Ayla Admin",
  email: "ayla@admin.com",
  passwordHash: hash,
  role: "admin",
  loyaltyStamps: 0,
  loyaltyCredits: 0,
  createdAt: new Date()
});
```

### Opção C — Endpoint seed protegido (mais prático)
Adicionar no backend:
```
POST /auth/seed-admin
Headers: x-seed-token: <env ADMIN_SEED_TOKEN>
Body: { email, password, name }
```
Cria o admin uma única vez se nenhum admin existir. Depois pode ser desabilitado.
