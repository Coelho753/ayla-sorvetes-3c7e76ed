# 🛒 Produtos no Backend — Schema + Seed

Este projeto consome produtos do backend em `https://sorveteria-b.onrender.com/products`. A home (`/`) e o `/cardapio` agora buscam dessa API. Se a API estiver vazia ou offline, a home cai num **fallback local** com os produtos atuais hardcoded.

## 1. Schema do produto (o que precisa existir no backend)

Tabela / modelo `products`:

| Campo         | Tipo            | Obrigatório | Observação |
|---------------|-----------------|-------------|------------|
| `id`          | uuid / int      | ✅          | gerado pelo backend |
| `name`        | string          | ✅          | nome do sabor |
| `price`       | number (decimal)| ✅          | preço em R$ |
| `description` | string          | ❌          | descrição curta |
| `image`       | string (URL)    | ❌          | URL pública da imagem |
| `category`    | enum string     | ✅          | `tub` \| `cup` \| `popsicle` \| `acai` |
| `size`        | string          | ❌          | só p/ açaí: `1L`, `5L`, `300ml`, `Picolé` |
| `active`      | boolean         | ❌          | default `true` — `false` esconde da home |
| `createdAt`   | datetime        | ❌          | gerado |

## 2. Endpoints REST esperados

Já consumidos pelo frontend (`/admin` e `/cardapio`):

```
GET    /products              → lista todos (público ou autenticado)
POST   /products              → cria (admin)
PUT    /products/:id          → edita (admin)
DELETE /products/:id          → remove (admin)
```

A resposta de `GET /products` pode ser:
- `Product[]` direto, **ou**
- `{ data: Product[] }` (o frontend aceita os dois formatos)

## 3. Como popular o backend (seed)

O arquivo `scripts/seed-products.json` contém os **41 produtos** que estão hoje hardcoded na home. Para enviá-los ao backend, faça login como admin e rode:

```bash
# Coloque seu token de admin (obtido no /login do site)
export ADMIN_TOKEN="cole_o_accessToken_aqui"

bun scripts/seed-products.ts
```

O script faz `POST /products` para cada item. Depois disso, a home passa a ler do backend automaticamente.

## 4. Onde vivem os dados hoje (fallback)

- `src/routes/index.tsx`: arrays `tubs`, `cups`, `popsicles`, `acaiProducts` — usados quando `/products` retorna vazio ou erro.
- `src/lib/products.ts`: helper `fetchProducts()` + `groupByCategory()`.

> Quando o backend tiver dados, **eles têm prioridade** sobre o hardcoded.
