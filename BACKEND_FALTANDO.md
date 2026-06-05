# Backend — rotas ausentes ou com bug

Diagnóstico feito em `https://sorveteria-b-m8k4.onrender.com` testando cada endpoint chamado pelo front. Frontend já está pronto para consumir tudo abaixo — basta implementar no backend.

## Atualização — junho/2026

As últimas mudanças no painel não exigem migrações novas; quase tudo já é
atendido pelos endpoints existentes. Os pontos abaixo estão valendo:

1. **Financeiro só conta pedidos confirmados.** O front passou a filtrar
   estatísticas por `status ∈ { pago, separando, saiu_para_entrega, entregue }`.
   O backend precisa garantir que:
   - `GET /orders` devolva o `status` real em **lowercase** com esses valores
     (não usar mais `novo` / `preparando` / `enviado` — manter compat só
     enquanto migra).
   - Cada `PUT /orders/:id { status }` aceite os mesmos valores.
2. **Pedidos externos (balcão / eventos)** continuam locais ao painel
   (localStorage do admin) — não precisam de tabela. Caso queira persistir
   no servidor, sugerimos:
   - `POST /orders` com `source: "external"` + `customerName` + `items`
     `[{ name, quantity, price }]` + `status: "pago"` + `total`.
   - Esses devem aparecer no `GET /orders` e somar no financeiro
     automaticamente, mas o front continua aceitando o modo offline.
3. **Carrosséis da home (ordem / adicionar / remover / editar preço por
   item).** O front armazena overrides no localStorage do admin. Para
   sincronizar entre dispositivos, criar:
   - `GET /carousels` → `{ key, items: [{ id, name, price, img, desc }] }`
   - `PUT /carousels/:key` (admin) com a lista completa.
   - Chaves esperadas: `tubs`, `cups`, `popsiclesAgua`, `popsiclesLeite`,
     `popsiclesPremium`, `popsiclesSki`, `acai`.
   - Enquanto não existir, o front continua funcionando 100% local.
4. **Card com preço.** O `ProductCard` exige `price` (number, em R$).
   Confirme que `GET /products` devolve `price` numérico (não string).
5. **Botão "Pedir pelo WhatsApp" foi removido do hero da home.** Continua
   apenas no CTA do fim da página e no botão flutuante. Nenhuma rota
   afetada.

## Resultado dos testes

| Endpoint                    | Status atual                                | Problema                          |
|----------------------------|---------------------------------------------|-----------------------------------|
| `POST /auth/register`      | ✅ 201                                       | OK (exige senha forte ≥10 chars) |
| `POST /auth/login`         | ✅ 200                                       | OK                                |
| `GET  /orders/me`          | ✅ 200                                       | OK                                |
| `GET  /users` (admin)      | ✅ 200/403                                   | OK                                |
| `GET  /orders` (admin)     | ✅ 200/403                                   | OK                                |
| `PUT  /orders/:id`         | ✅ existe (403 sem admin)                    | OK                                |
| **`DELETE /users/:id`**    | ❌ **404 "Rota não encontrada"**             | **NÃO EXISTE — implementar**     |
| **`DELETE /orders/:id`**   | ❌ **404 "Rota não encontrada"**             | **NÃO EXISTE — implementar**     |
| **`PUT /users/:id` (password/email)** | ⚠️ Existe, mas precisa aceitar `password` / `email` no body para admin redefinir | **Estender validador**          |

## 1. `DELETE /users/:id` (admin)

```js
// routes/users.js
router.delete('/:id', requireAdmin, async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  // opcional: anonimizar pedidos antigos em vez de apagar
  await Order.updateMany({ userId: req.params.id }, { $unset: { userId: 1 } });
  res.json({ ok: true });
});
```

## 2. `DELETE /orders/:id` (admin)

```js
// routes/orders.js
router.delete('/:id', requireAdmin, async (req, res) => {
  const o = await Order.findByIdAndDelete(req.params.id);
  if (!o) return res.status(404).json({ message: 'Pedido não encontrado' });
  res.json({ ok: true });
});
```

## 3. `PUT /users/:id` — aceitar `password` e `email` quando for admin

Hoje o validador parece rejeitar campos extras. Ajuste para permitir, quando `req.user.role === 'admin'`:

- `email` (validar formato e unicidade)
- `password` / `senha` (hash com bcrypt antes de salvar; aplicar as mesmas regras do cadastro: ≥10 chars, maiúscula, minúscula, número, símbolo)

```js
router.put('/:id', requireAuth, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const isSelf  = String(req.user.id) === String(req.params.id);
  if (!isAdmin && !isSelf) return res.status(403).json({ message: 'Acesso negado' });

  const patch = {};
  if (req.body.name ?? req.body.nome) patch.nome = req.body.name ?? req.body.nome;
  if (req.body.phone ?? req.body.telefone) patch.telefone = req.body.phone ?? req.body.telefone;
  if (req.body.address ?? req.body.endereco) patch.endereco = req.body.address ?? req.body.endereco;

  if (isAdmin) {
    if (req.body.role) patch.role = req.body.role;
    if (req.body.email) patch.email = req.body.email.toLowerCase();
  }

  const pwd = req.body.password ?? req.body.senha;
  if (pwd) {
    if (pwd.length < 10) return res.status(400).json({ message: 'Senha muito curta' });
    patch.password = await bcrypt.hash(pwd, 10);
  }

  const u = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!u) return res.status(404).json({ message: 'Usuário não encontrado' });
  res.json(publicUser(u));
});
```

## 4. (Opcional, recomendado) Notificar mudança de status do pedido

O front faz polling em `/orders/me` a cada 30s para o cliente acompanhar o status. Funciona sem nada extra no backend, mas se quiser tempo real, exponha **uma destas opções**:

- **SSE** em `GET /orders/me/stream` (mais simples, funciona em HTTP/1.1):
  ```js
  router.get('/me/stream', requireAuth, (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    const interval = setInterval(async () => {
      const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
      send(orders);
    }, 15000);
    req.on('close', () => clearInterval(interval));
  });
  ```
- **Webhook → WhatsApp** quando o admin muda o status (envia uma mensagem para `customerPhone`).

## 5. Regras de senha (alinhar com o front)

O cadastro do front hoje exige: **≥10 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo**. Garanta a MESMA regra no validador do `POST /auth/register` e no `PUT /users/:id` quando vier `password`. Hoje o backend está mais restrito (rejeita `Teste@123` que tem 9 chars).

## 6. CORS

Continue liberando:
- `https://*.lovable.app`
- `https://ayla-sorvetes-yfbk.onrender.com`
- `http://localhost:5173`

Métodos: `GET, POST, PUT, DELETE, OPTIONS`. Headers: `Content-Type, Authorization`.

---

## 7. Novas categorias de produto (categorias dos picolés + potes/copos/açaí)

O cadastro de produto no admin agora envia `category` com um destes valores:

| Valor enviado     | Significado          |
|-------------------|----------------------|
| `pote`            | Pote 1,5L            |
| `cup`             | Copo 300ml           |
| `pic_agua`        | Picolé base água     |
| `pic_leite`       | Picolé base leite    |
| `pic_premium`     | Picolé Premium       |
| `pic_ski`         | Picolé Ski           |
| `acai`            | Açaí                 |

Aceite TAMBÉM os valores legados `tub` e `popsicle` para retrocompatibilidade
(podem ser migrados depois). Ajuste o enum/validador do `POST /products`
e `PUT /products/:id`:

```js
const CATEGORIES = ['pote','tub','cup','pic_agua','pic_leite','pic_premium','pic_ski','popsicle','acai'];
```

## 8. Novos status de pedido (fluxo de pagamento + entrega)

O admin agora opera o pedido em duas etapas:

1. **Pagamento**: `pendente` → botão **Confirmar pagamento** (`pago`) ou **Cancelar** (`cancelado`).
2. **Entrega** (só após pago): `separando` → `saiu_para_entrega` → `entregue`.

Atualize o enum/validador de `status` em `PUT /orders/:id` para aceitar:

```js
const STATUSES = [
  'pendente', 'pago', 'cancelado',
  'separando', 'saiu_para_entrega', 'entregue',
  // legados — manter aceitando até migrar a base
  'novo', 'preparando', 'enviado'
];
```

Recomendado: na criação de pedido (`POST /orders`), default = `pendente`.

## 9. Nome do cliente no pedido (admin precisa ver quem pediu)

O painel admin agora destaca **o nome de quem fez o pedido** em cada card.
Garanta que o backend, em `GET /orders` (admin), retorne em cada pedido:

- `customerName` (string) — nome do cliente que fez o pedido, OU
- `user: { name, email }` populado (preferido — `populate('userId', 'name email')` no Mongoose).

E em pedidos do WhatsApp/site sem login, salve `customerName` + `customerPhone` direto no documento do pedido.

## 10. Tela de login obrigatória ao entrar no app

O front agora redireciona qualquer rota não pública para `/login` quando o
usuário não está autenticado. **Sem alteração no backend.** Apenas
confirme que `POST /auth/login` e `POST /auth/register` continuam funcionando
e que `GET /users/me` retorna o usuário autenticado (já está OK).

## 11. (Opcional) Top produtos manualmente — somente front

A edição manual dos "produtos mais pedidos" e o registro de **vendas por
fora do aplicativo** ficam salvos no `localStorage` do navegador do admin.
Não precisa de backend agora. Se quiser sincronizar entre admins no futuro,
exponha:

- `GET/PUT /admin/top-products-overrides` — JSON `{ [productName]: { qty, revenue } }`
- `GET/POST/DELETE /admin/external-sales` — `{ id, date, description, value }`