
# Plano — Fidelidade 10+1 e Painel Admin reformulado

## Visão geral

O backend fica em `https://sorveteria-b.onrender.com` (repo Render separado, ver `PRODUTOS_BACKEND.md`). Eu não tenho acesso a ele — abaixo está exatamente o que você precisa pedir para quem mantém esse repo. No frontend (este projeto Lovable), eu implemento o consumo dos novos endpoints, a UI do programa de fidelidade e a reformulação do painel admin.

---

## 1. Programa Fidelidade "10 potes = 1 grátis"

### Regra de negócio
- Cada pote (`category="tub"`) comprado e com pedido em status `entregue` soma **1 selo** ao usuário.
- Ao atingir **10 selos**, o usuário ganha **1 crédito** (1 pote grátis).
- O crédito é acumulável entre compras (não expira por padrão; podemos definir validade depois).
- No carrinho, se o usuário tem ≥1 crédito, aparece um toggle **"Usar 1 pote grátis"** que zera o item de menor preço da categoria pote. O crédito é debitado só quando o pedido vira `entregue` (evita fraude com cancelamento).

### Mudanças no BACKEND (pedir ao mantenedor)

**Schema `users` — adicionar:**
| Campo | Tipo | Default | Observação |
|---|---|---|---|
| `loyaltyStamps` | int | 0 | selos acumulados desde o último resgate |
| `loyaltyCredits` | int | 0 | potes grátis disponíveis |

**Schema `orders` — adicionar:**
| Campo | Tipo | Default | Observação |
|---|---|---|---|
| `loyaltyCreditsUsed` | int | 0 | nº de créditos aplicados neste pedido |
| `loyaltyStampsEarned` | int | 0 | preenchido quando status muda para `entregue` |

**Lógica no `PUT /orders/:id` (admin muda status):**
- Quando status passa para `entregue` **pela primeira vez**:
  - Conta potes do pedido: `potes = sum(items.quantity where productId.category="tub")`.
  - `users.loyaltyStamps += potes`
  - Enquanto `loyaltyStamps >= 10`: `loyaltyStamps -= 10; loyaltyCredits += 1`.
  - Marca `loyaltyStampsEarned = potes` no pedido (idempotência: não reaplica se já preenchido).
- Quando status passa para `cancelado` **depois** de `entregue`: reverter (`loyaltyStamps -= loyaltyStampsEarned`; se ficar negativo, debitar de `loyaltyCredits`).
- Ao criar pedido com `loyaltyCreditsUsed > 0`: validar `users.loyaltyCredits >= loyaltyCreditsUsed` e debitar imediatamente (reembolsar se cancelar antes da entrega).

**Endpoint novo (opcional mas útil):**
```
GET /users/me/loyalty   → { stamps: 7, credits: 1, nextRewardIn: 3 }
```

**`GET /users/me` e `GET /users` precisam retornar** `loyaltyStamps` e `loyaltyCredits` para o admin ver.

### Mudanças no FRONTEND (eu faço)
- `src/contexts/AuthContext.tsx`: adicionar `loyaltyStamps` e `loyaltyCredits` ao `User`.
- `src/contexts/CartContext.tsx`: novo estado `useFreeTub: boolean`; quando true, aplica desconto do pote mais barato e envia `loyaltyCreditsUsed: 1` no `POST /orders`.
- Novo componente `src/components/LoyaltyBadge.tsx`: barrinha de progresso (7/10 potes) na home logada e no `/perfil`.
- Toggle "🎁 Usar 1 pote grátis (você tem N)" no `CartFloat.tsx`.

---

## 2. Painel Admin reformulado

### Layout proposto

```text
┌──────────────────────────────────────────────────────────┐
│ Painel Admin                          [👤 Perfil] [💰 Financeiro] │
├──────────────────────────────────────────────────────────┤
│ [Dashboard] [Produtos] [Pedidos] [WhatsApp] [Usuários]   │
└──────────────────────────────────────────────────────────┘
```

Os dois botões à direita do título — **Perfil** e **Financeiro** — abrem rotas próprias (`/admin/perfil`, `/admin/financeiro`), separados das abas de operação.

### 2.1 Aba Usuários — agora com edição completa + pedidos

Hoje em `src/routes/admin.tsx → UsersAdmin` só dá pra mudar role. Vou trocar para uma lista que abre **drawer/modal** ao clicar no usuário, com:
- **Edição de perfil**: nome, telefone, role, endereço completo, créditos de fidelidade (admin pode dar bônus).
- **Histórico de pedidos do usuário**: lista paginada com status, total, itens, botão de mudar status inline.
- **Indicador de fidelidade**: "7/10 potes • 1 pote grátis disponível".

Backend precisa expor:
```
GET  /users/:id              → user completo + loyalty
PUT  /users/:id              → aceitar { name, phone, role, address, loyaltyCredits }
GET  /orders?userId=:id      → pedidos daquele usuário (admin only)
```

### 2.2 Botão "Financeiro" (nova rota `/admin/financeiro`)

Página com:
- **Total vendido** (filtro por período: hoje / 7d / 30d / mês / customizado).
- **Receita por status** (pago, entregue vs cancelado).
- **Receita por origem** (site vs WhatsApp).
- **Top produtos** (já existe no Dashboard, replicar com filtro de período).
- **Gráfico de linha** receita/dia (usando Recharts, já instalado).
- Botão **Exportar CSV** dos pedidos do período.

Backend ideal (mas funciona sem — eu agrego no front a partir de `GET /orders`):
```
GET /orders?from=ISO&to=ISO   → filtro server-side (otimização futura)
```

### 2.3 Botão "Perfil do Admin" (nova rota `/admin/perfil`)

Reusa o componente de edição de perfil já existente em `/perfil`, mas com badge "Administrador".

---

## 3. Criação do usuário admin

**Pedir ao mantenedor do backend** que rode no shell do Render (ou direto no Mongo/Postgres):

```js
// Mongo
db.users.insertOne({
  name: "Ayla Admin",
  email: "ayla@admin.com",
  passwordHash: <bcrypt("#75345609Ds", 10)>,
  role: "admin",
  createdAt: new Date()
})
```

Ou, mais simples e seguro: registrar normalmente pela tela `/cadastro` com esse email/senha e depois rodar:

```js
db.users.updateOne({ email: "ayla@admin.com" }, { $set: { role: "admin" } })
```

⚠️ **Não enviar a senha em texto plano por chat/email** — quem for criar deve gerar o hash localmente. Se preferir, eu posso adicionar um endpoint `POST /auth/seed-admin` protegido por `ADMIN_SEED_TOKEN` (env var) que cria o admin uma única vez — me avise.

---

## 4. Resumo do que muda em cada lado

### Backend (pedir ao mantenedor — repo Render)
1. Adicionar `loyaltyStamps`, `loyaltyCredits` em `users`.
2. Adicionar `loyaltyCreditsUsed`, `loyaltyStampsEarned` em `orders`.
3. Lógica de selos no `PUT /orders/:id` (transição para `entregue`).
4. `GET /users/:id`, `PUT /users/:id` aceitando todos os campos (name, phone, address, role, loyaltyCredits).
5. `GET /orders?userId=...` e idealmente `?from=&to=`.
6. `GET /users/me/loyalty` (opcional).
7. Criar usuário `ayla@admin.com` com role `admin`.

### Frontend (eu faço neste projeto)
- `src/contexts/AuthContext.tsx` — campos de fidelidade no User.
- `src/contexts/CartContext.tsx` — usar crédito.
- `src/components/CartFloat.tsx` — toggle "usar pote grátis".
- `src/components/LoyaltyBadge.tsx` — novo, barra de progresso.
- `src/routes/index.tsx` e `src/routes/perfil.tsx` — exibir badge.
- `src/routes/admin.tsx` — header com botões Perfil/Financeiro; `UsersAdmin` com drawer de edição+pedidos.
- `src/routes/admin.perfil.tsx` — nova.
- `src/routes/admin.financeiro.tsx` — nova, com Recharts e exportar CSV.
- `PRODUTOS_BACKEND.md` — atualizar a doc com os novos schemas/endpoints.

---

## Próximo passo

Confirma este plano? Em seguida eu:
1. Implemento todo o frontend já preparado pra consumir os novos campos (com fallback gracioso enquanto o backend não estiver pronto — ex.: se `loyaltyCredits` vier `undefined`, o toggle some).
2. Atualizo `PRODUTOS_BACKEND.md` com a especificação acima pronta pra você mandar pro mantenedor.
3. Te dou o snippet exato pra criar o admin.
