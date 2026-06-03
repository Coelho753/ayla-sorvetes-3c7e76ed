# Backend — rotas ausentes ou com bug

Diagnóstico feito em `https://sorveteria-b-m8k4.onrender.com` testando cada endpoint chamado pelo front. Frontend já está pronto para consumir tudo abaixo — basta implementar no backend.

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