# Instruções para IA — Refatorar o backend Ayla Sorvetes

Você é uma IA de engenharia. Sua tarefa é refatorar o backend
`sorveteria-b-m8k4` (Node/Express + MongoDB, hospedado no Render) para
atender ao frontend atual. **Não altere CORS** (já está correto). Execute
cada seção abaixo. Ao terminar cada seção, rode os testes indicados.

> Regras gerais
> - Sempre valide entrada com Zod (ou Joi) e sanitize strings.
> - Nunca aceite campos extras não validados.
> - Use transações Mongo para operações que tocam múltiplos documentos
>   (pedido + estoque).
> - Senhas: bcrypt cost 12, mínimo 10 caracteres com maiúscula, minúscula,
>   número e símbolo. Mesma regra no `POST /auth/register` e no
>   `PUT /users/:id` quando vier `password`.
> - JWT: `HS256`, expiração 7 dias, `secret` obrigatório em `process.env.JWT_SECRET`.
>   Falhar o boot se ausente.
> - Todo endpoint admin exige middleware `requireAdmin` que checa `req.user.role === 'admin'`.
> - Toda rota autenticada exige `requireAuth`.
> - Rate limit: `express-rate-limit` global (100 req / 15 min por IP) e
>   específico em `/auth/*` (10 req / 15 min).
> - Log estruturado (pino) sem vazar tokens/senha.

---

## 1. Novos preços (fonte da verdade)

Rode um script de seed/migração que atualize o preço de cada produto
**pela combinação nome + categoria** (não pelo id). Se o produto não
existir, criar. Preços em BRL:

| Categoria (`category`) | Produto (`name`)             | `price` |
|------------------------|------------------------------|---------|
| `pote`                 | *(todos)*                    | 14.00   |
| `cup`                  | *(todos, exceto açaí)*       | 5.00    |
| `pic_agua`             | *(todos)*                    | 1.50    |
| `pic_leite`            | *(todos)*                    | 2.00    |
| `pic_premium`          | Brigadeiro                   | 5.00    |
| `pic_premium`          | Leitinho                     | 5.00    |
| `pic_premium`          | Torta de Limão               | 5.00    |
| `pic_ski`              | Skimo, Ski Coco, Tentação    | 4.00    |
| `acai`                 | Açaí Premium 1L              | 18.00   |
| `acai`                 | Açaí Premium 5L              | 80.00   |
| `acai`                 | Copo de Açaí                 | 8.00    |
| `acai`                 | Picolé de Açaí               | 2.00    |

`price` no schema deve ser `Number` (não string). `GET /products` DEVE
retornar `price` como número.

---

## 2. Categorias de produto

Enum aceito em `POST /products` e `PUT /products/:id`:

```js
const CATEGORIES = [
  'pote', 'cup',
  'pic_agua', 'pic_leite', 'pic_premium', 'pic_ski',
  'acai',
  // legados — aceitar por retrocompat, migrar depois
  'tub', 'popsicle'
];
```

Adicione migração que troque `tub → pote` e `popsicle → pic_agua` (ou
`pic_leite` conforme nome) nos documentos existentes.

---

## 3. Estoque (`stock`)

Adicione ao schema `Product`:

```js
stock: { type: Number, default: 0, min: 0 }
```

- `POST /products` e `PUT /products/:id` aceitam `stock`.
- `GET /products` retorna `stock` em todos os itens.
- **Débito atômico**:
  - Em `POST /orders` quando `status === 'pago'` na criação.
  - Em `PUT /orders/:id` quando `status` muda de qualquer valor para `'pago'`.
  - Usar `Product.updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })`
    dentro de uma transação. Se algum item falhar (retorno `modifiedCount: 0`),
    abortar a transação e responder `400 { message: "Produto X sem estoque" }`.
- **Devolução**: quando `status` muda para `'cancelado'` a partir de `'pago'`
  (ou posterior), fazer `$inc: { stock: +qty }`.
- Itens sem `productId` (vendas externas manuais) não movem estoque, mas
  são aceitos.

---

## 4. Pedidos — schema e endpoints

Schema `Order`:

```js
{
  userId: ObjectId | null,        // null p/ vendas externas
  customerName: String,           // sempre gravar
  customerPhone: String | null,
  source: { type: String, enum: ['site', 'external'], default: 'site' },
  status: {
    type: String,
    enum: [
      'pendente', 'pago', 'cancelado',
      'separando', 'saiu_para_entrega', 'entregue',
      // legados aceitos por retrocompat
      'novo', 'preparando', 'enviado'
    ],
    default: 'pendente'
  },
  items: [{
    productId: ObjectId | null,
    name: String,
    quantity: Number,
    price: Number,          // preço unitário efetivo (já com atacado)
    basePrice: Number,      // preço original antes de atacado
    category: String
  }],
  total: Number,            // sempre número
  wholesaleDiscount: Number,
  address: Object | null,
  createdAt: Date,          // aceitar do body em vendas externas
  updatedAt: Date
}
```

Endpoints:

| Método | Rota                    | Auth        | Observação |
|--------|-------------------------|-------------|------------|
| POST   | `/orders`               | opcional    | Se `source==='external'`, exigir `requireAdmin` e aceitar `status:'pago'` + `createdAt` do body. Sem admin: sempre `status:'pendente'`. |
| GET    | `/orders`               | admin       | Lista todos. Popular `userId` com `name email`. |
| GET    | `/orders/me`            | auth        | Só do próprio usuário. |
| PUT    | `/orders/:id`           | admin       | Aceita transição de status; aplicar débito/devolução de estoque. |
| DELETE | `/orders/:id`           | admin       | Se pedido estava `pago+`, devolver estoque antes de apagar. |
| GET    | `/orders/me/stream`     | auth        | (Opcional) SSE, tick 15s com `Order.find({userId})`. |

`GET /orders` DEVE retornar `total` numérico, `status` lowercase,
`createdAt` ISO, `source`, `customerName` e cada `items[i]` com
`name`, `quantity`, `price` (número).

---

## 5. Usuários

| Método | Rota              | Auth  | Ação |
|--------|-------------------|-------|------|
| POST   | `/auth/register`  | -     | Regras de senha da seção 0. Retorna `{ user, accessToken, refreshToken }`. |
| POST   | `/auth/login`     | -     | Aceitar `email` + (`password` OU `senha`). |
| GET    | `/users/me`       | auth  | Já existe — manter. |
| PUT    | `/users/me`       | auth  | Aceitar `endereco`/`address`, `phone`, `name`. |
| GET    | `/users`          | admin | Lista todos. |
| PUT    | `/users/:id`      | auth  | Self ou admin. Admin pode setar `email`, `password`, `role`. Aplicar hash bcrypt se `password` presente. |
| DELETE | `/users/:id`      | admin | Não permitir apagar o próprio usuário admin logado. Anonimizar pedidos: `$unset: { userId: 1 }`. |

Modelo `User`:
```js
{ nome, email (unique, lowercase), password (hash), role: enum('user','admin') default 'user',
  telefone, endereco: { cep, rua, numero, complemento, bairro, cidade, estado }, createdAt }
```

`role` NUNCA pode ser alterado por não-admin. Ignorar campo `role` do body
quando `req.user.role !== 'admin'`.

---

## 6. Atacado (`/wholesale`)

Coleção `WholesaleConfig` (documento único, `key: 'global'`):

```js
{
  key: 'global',
  threshold: { type: Number, default: 3 },
  defaultDiscount: { type: Number, default: 0.35 }, // 0..1
  categories: Map<String, Number>,   // { pote: 10, cup: 3.5, popsicle: 1.2 }
  products: Map<String, Number>      // { "<productId>": 4.5 }
}
```

Endpoints (todos admin, exceto GET):

| Método | Rota                                | Auth  |
|--------|-------------------------------------|-------|
| GET    | `/wholesale`                        | -     |
| PUT    | `/wholesale/config`                 | admin |
| PUT    | `/wholesale/category`               | admin | body `{ category, price }` |
| DELETE | `/wholesale/category/:category`     | admin |
| PUT    | `/wholesale/product`                | admin | body `{ productId, price }` |
| DELETE | `/wholesale/product/:productId`     | admin |

Retornar sempre `{ config, categories, products }` em `GET /wholesale`.

---

## 7. Carrosséis da home (opcional mas recomendado)

Sincroniza entre admins qual produto aparece em cada seção da home.

```
GET  /carousels             → { [key]: string[] }   // arrays de productId
PUT  /carousels/:key        admin  body { productIds: string[] }
```

Chaves válidas: `tubs`, `cups`, `popsiclesAgua`, `popsiclesLeite`,
`popsiclesPremium`, `popsiclesSki`, `acai`.

---

## 8. Financeiro (opcional — reduz carga no cliente)

```
GET /admin/financial-summary?period=7d|30d|90d|all
→ {
    total: Number,
    ticket: Number,
    count: Number,
    bySource: { site: {count,total}, external: {count,total} },
    byDay: [{ day: 'YYYY-MM-DD', value: Number }],
    topProducts: [{ name, category, quantity, revenue }]
  }
```

Considerar apenas pedidos com `status ∈ { pago, separando, saiu_para_entrega, entregue }`.

---

## 9. Segurança — checklist final

- [ ] `helmet()` habilitado.
- [ ] `express.json({ limit: '100kb' })`.
- [ ] Rate limit global + auth.
- [ ] Nunca retornar `password` em nenhum endpoint (usar `.select('-password')` ou `publicUser()`).
- [ ] Validar `ObjectId` em `:id` antes de query (evitar cast error 500).
- [ ] JWT secret obrigatório em env; boot falha se ausente.
- [ ] Senha: bcrypt cost 12; regras da seção 0.
- [ ] `role` nunca alterável por não-admin.
- [ ] `email` sempre lowercase e unique.
- [ ] Todos os endpoints admin protegidos por `requireAdmin`.
- [ ] Transações Mongo em criação/atualização de pedido pagos (estoque).
- [ ] Logs sem vazar Authorization / body de auth.
- [ ] `PORT` do env, `0.0.0.0`.
- [ ] Healthcheck `GET /health → 200 { ok: true }`.

---

## 10. Testes de aceitação

Execute com curl ou Postman e confirme:

```bash
# 1. Preços
curl $API/products | jq '.[0] | {name, price, category, stock}'   # price:Number, stock:Number

# 2. Cadastro de venda externa (admin)
curl -X POST $API/orders -H "Authorization: Bearer $ADMIN" -H 'content-type: application/json' \
  -d '{"source":"external","status":"pago","customerName":"Balcão","items":[{"name":"Copo","quantity":2,"price":5}],"total":10,"createdAt":"2026-07-01T14:00:00Z"}'
# → 201, aparece em GET /orders

# 3. Estoque debita
curl $API/products/$ID | jq .stock           # antes: 10
# criar pedido pago com 3 unidades desse produto
curl $API/products/$ID | jq .stock           # depois: 7

# 4. Cancelar devolve
curl -X PUT $API/orders/$OID -d '{"status":"cancelado"}'
curl $API/products/$ID | jq .stock           # 10 de novo

# 5. DELETE /users/:id e /orders/:id retornam 200/204
```

Se todos os itens acima passarem, o backend está alinhado com o frontend
atual do app Ayla Sorvetes.
---

## URGENTE — POST/PUT /products retorna 403 para admin

Sintoma: usuário com `role: "admin"` no MongoDB consegue logar e ler `/users/me`, mas `POST /products` e `PUT /products/:id` respondem **403 Forbidden**.

### Instruções para a IA de backend
1. Abra o middleware de autorização das rotas de produto (ex.: `requireAdmin` / `isAdmin` / `authorize('admin')`).
2. Garanta que ele compara com o valor salvo no banco: o documento do usuário tem `role: "admin"` (string, minúsculo). Aceite `req.user.role === 'admin'` — sem exigir campos extras como `isAdmin`, `permissions` ou claims no JWT.
3. Se o middleware lê o role do **JWT** em vez do banco, inclua `role` no payload do token no login (`jwt.sign({ id, role }, ...)`) OU faça lookup do usuário no banco dentro do middleware (preferível).
4. Confirme que as rotas usam o campo correto do body: `name`, `category`, `price`, `size`, `image`, `stock`, `active`, `description` (inglês). Se o schema espera português (`nome`, `categoria`...), aceite ambos.
5. Categorias válidas esperadas pelo frontend: `pote`, `cup`, `pic_agua`, `pic_leite`, `pic_premium`, `pic_ski`, `acai`. Não rejeite essas strings no enum do schema.
6. Teste com: `curl -X POST $API/products -H "Authorization: Bearer <token_admin>" -H "Content-Type: application/json" -d '{"name":"Teste","category":"pote","price":14,"size":"1,5L","stock":0,"active":true}'` — deve retornar 201.
