# 🛒 Backend — Produtos, Pedidos (WhatsApp), Usuários e Atacado

API: `https://sorveteria-b.onrender.com`. O front consome: **products**, **orders**, **users** e **wholesale (atacado)**.

> **Mudança importante — Clube Ayla foi REMOVIDO.** Agora vale o sistema de **Atacado**: a partir de 3 itens da mesma categoria (potes, copos, picolés) o cliente entra em preço de atacado. Pode remover do banco `loyaltyStamps`, `loyaltyCredits`, `loyaltyStampsEarned`, `loyaltyCreditsUsed` e os endpoints `/users/me/loyalty`.

---

## 1. Produtos (`/products`)

| Campo | Tipo | Obrig. |
|---|---|---|
| `id` | uuid/int | ✅ |
| `name` | string | ✅ |
| `price` | number | ✅ (preço cheio) |
| `wholesalePrice` | number | ❌ (override por produto p/ atacado) |
| `description` | string | ❌ |
| `image` | string (URL) | ❌ |
| `category` | enum: `tub` \| `cup` \| `popsicle` \| `acai` | ✅ |
| `size` | string | ❌ |
| `active` | boolean | default `true` |

```
GET    /products
POST   /products       (admin)
PUT    /products/:id   (admin)
DELETE /products/:id   (admin)
```

---

## 2. Atacado (NOVO — `/wholesale`)

Hoje o front salva preços de atacado em `localStorage`. Para virar fonte da verdade no backend, exponha:

### Tabela `wholesale_category_prices`
| Campo | Tipo |
|---|---|
| `category` | PK — `tub` \| `cup` \| `popsicle` |
| `price` | number |
| `updated_at` | datetime |

### Tabela `wholesale_config`
| Campo | Tipo | Default |
|---|---|---|
| `threshold` | int | 3 |
| `default_discount` | float | 0.35 |

### Endpoints
```
GET    /wholesale                      público
       → { config: { threshold, defaultDiscount },
           categories: { tub?, cup?, popsicle? },
           products: { [id]: price } }

PUT    /wholesale/category             admin    { category, price }
DELETE /wholesale/category/:category   admin
PUT    /wholesale/product              admin    { productId, price }
DELETE /wholesale/product/:id          admin
PUT    /wholesale/config               admin    { threshold, defaultDiscount }
```

### Cálculo no `POST /orders` (servidor recalcula — NÃO confie no client)
```
para cada item, conte por categoria;
se count(cat) >= threshold:
  preço = products[id].wholesale_price
       ?? wholesale_category_prices[cat]
       ?? round(price * (1 - default_discount))
senão:
  preço = price (cheio)
total = soma(preço * quantity)
```

---

## 3. Pedidos (`/orders`)

| Campo | Tipo |
|---|---|
| `id` | uuid/int |
| `userId` | ref users (nullable em pedidos WhatsApp anônimos) |
| `customerName`, `customerPhone` | string |
| `items` | json[]: `{ productId, name, quantity, price, basePrice?, category }` |
| `total` | number |
| `wholesaleDiscount` | number (informativo) |
| `address` | json |
| `status` | `pendente` \| `pago` \| `preparando` \| `enviado` \| `entregue` \| `cancelado` |
| `source` | `site` \| `whatsapp` |
| `createdAt` | datetime |

```
GET    /orders                       admin
GET    /orders?source=whatsapp       admin (o front também filtra no client)
GET    /orders/me                    usuário
POST   /orders                       usuário (servidor recalcula com atacado)
POST   /orders/whatsapp              público com secret (ou via webhook)
PUT    /orders/:id                   admin (mudar status)
DELETE /orders/:id                   admin
```

### WhatsApp — como popular pedidos `source="whatsapp"`
- **A — Manual**: admin já tem visão filtrada em `/admin → Pedidos → WhatsApp`. Insira via `POST /orders/whatsapp` com `customerName`, `customerPhone`, `items`, `total`, `source:"whatsapp"`.
- **B — Webhook WhatsApp Business / Z-API / Twilio**: assine eventos de mensagem; ao reconhecer pedido, chame internamente o endpoint acima.
- **C — Bot externo (n8n etc.)**: traduz conversa em JSON e POSTa.

> Segurança: o endpoint público `POST /orders/whatsapp` deve exigir um header `x-webhook-secret` (env `WHATSAPP_WEBHOOK_SECRET`).

---

## 4. Usuários (`/users`)

| Campo | Tipo |
|---|---|
| `id`, `name`, `email`, `phone`, `role` (`user`\|`admin`), `address` (json), `createdAt` |

```
POST   /auth/register   público (NUNCA aceitar role)
POST   /auth/login
POST   /auth/refresh
GET    /auth/me  (ou /users/me)
GET    /users                  admin
PUT    /users/:id              admin  { name, phone, role, address }
DELETE /users/:id              admin
GET    /orders?userId=ID       admin (drawer de usuário)
```

> Remover dos schemas: `loyaltyStamps`, `loyaltyCredits`, `loyaltyStampsEarned`, `loyaltyCreditsUsed`. Remover endpoints `/users/me/loyalty`.

---

## 5. Telefone do WhatsApp

O front lê o número **único** de `src/config/api.ts → WHATSAPP_PHONE`. Hoje: `5511965474023`. Trocou de número? Mude lá — `WhatsAppFloat`, `CartFloat` e botões da home apontam para a mesma fonte.

(Opcional) expor `GET /config/public → { whatsappPhone }` no backend e o front passa a consumir.

---

## 6. Permissões (resumo)

| Endpoint | Anon | User | Admin |
|---|:-:|:-:|:-:|
| `GET /products`, `GET /wholesale` | ✅ | ✅ | ✅ |
| `POST/PUT/DELETE /products` | ❌ | ❌ | ✅ |
| `PUT/DELETE /wholesale/...` | ❌ | ❌ | ✅ |
| `POST /orders` | ❌ | ✅ | ✅ |
| `POST /orders/whatsapp` | ✅ (secret) | — | ✅ |
| `GET /orders` | ❌ | ❌ | ✅ |
| `GET /orders/me` | ❌ | ✅ | ✅ |
| `GET/PUT/DELETE /users` | ❌ | ❌ | ✅ |

---

## 7. Promover admin (uma vez no banco)

```sql
UPDATE users SET role = 'admin' WHERE email = 'ayla@admin.com';
```
ou Mongo:
```js
db.users.updateOne({ email: "ayla@admin.com" }, { $set: { role: "admin" } })
```

Depois, novos admins são promovidos pela aba **Usuários** do painel.
