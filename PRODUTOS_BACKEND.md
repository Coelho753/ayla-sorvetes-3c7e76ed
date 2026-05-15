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
