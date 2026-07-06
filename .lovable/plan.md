# Migrar catálogo para o backend

## Objetivo

- Popular o MongoDB do backend `sorveteria-b-m8k4` com todos os produtos hoje hardcoded no frontend (`src/lib/catalog.ts`).
- Home e Cardápio passam a puxar 100% do backend, agrupados por categoria/sub-categoria.
- Apagar arrays estáticos do frontend para reduzir bundle e uso de memória no build.

## O que muda

### 1. Seed do backend (`scripts/seed-products.json` + `scripts/seed-products.ts`)

Reescrever o JSON com **todos** os produtos atuais do catálogo, cada um com:

```json
{
  "name": "Limão Suíço",
  "category": "pote",        // enum novo: pote|cup|pic_agua|pic_leite|pic_premium|pic_ski|acai
  "price": 14.00,             // tabela oficial da seção 1 do BACKEND_FALTANDO.md
  "size": "1,5L",
  "description": "...",
  "image": "/assets/tub-3d-limao-suico.jpg",  // URL relativa ao domínio do frontend
  "stock": 0,
  "active": true
}
```

Fontes:
- `tubs` → `pote` @ R$14
- `cups` → `cup` @ R$5
- `popsiclesAgua` → `pic_agua` @ R$1,50
- `popsiclesLeite` → `pic_leite` @ R$2
- `popsiclesPremium` → `pic_premium` @ R$5
- `popsiclesSki` → `pic_ski` @ R$4
- `acaiProducts` → `acai` (preços individuais 18/80/8/2)

Script `seed-products.ts` já existe — mantém, adicionar flag `UPSERT=1` que faz PUT por `name+category` em vez de POST puro (evita duplicar em re-runs). Passar `IMAGE_BASE` opcional para prefixar URLs quando o admin quiser apontar para o CDN do próprio site em produção.

### 2. Frontend — `src/lib/catalog.ts`

Remover:
- Todas as constantes de imagem (`tub*`, `cup*`, `popsicle*`, `acai*`).
- Arrays `tubs`, `cups`, `popsicles`, `popsiclesAgua`, `popsiclesLeite`, `popsiclesPremium`, `popsiclesSki`, `acaiProducts`.
- Mapa `imageMap` + `localImageFor` (backend agora entrega `image`).

Manter apenas:
- `CategoryKey`, `CATEGORY_LABELS`
- `PopsicleSub`, `POPSICLE_SUB_LABEL`
- Constantes de preço (usadas como default numérico quando o backend retorna 0)

Isso corta ~140 linhas + descarta todos os `import` de assets do grafo do Vite.

### 3. `src/lib/products.ts`

- Estender `Category` para incluir os novos enums (`pote`, `pic_agua`, `pic_leite`, `pic_premium`, `pic_ski`).
- `groupByCategory` retorna 4 buckets de picolé + tub + cup + acai.
- `imgOf` deixa de chamar `localImageFor`; usa apenas `p.image ?? p.imageUrl`.

### 4. `src/routes/index.tsx` (home / carrosséis)

- Remover import de `tubs`/`cups`/`popsicles*`/`acaiProducts`.
- Loader busca `/products` uma vez (via TanStack Query) e monta os 7 carrosséis a partir do resultado agrupado.
- Enquanto carrega: skeleton simples (spinner + placeholder). Se falhar: mensagem "Cardápio indisponível, tente novamente".
- `useImagePreload` recebe as imagens do resultado remoto.

### 5. `src/routes/cardapio.tsx`

- Remover `buildLocal()` e o fallback estático.
- Loader idêntico ao da home; tabs continuam iguais.

### 6. `src/routes/admin.tsx`

- Se ainda importa `tubs`/`cups`/... para "restaurar padrão", trocar por botão "Reimportar seed" que chama o endpoint upsert do backend.

## Riscos

- **Backend precisa estar populado.** Após o deploy, rodar `ADMIN_TOKEN=... bun scripts/seed-products.ts` uma vez. Antes disso o site fica vazio.
- Se o backend cair, o site mostra "Cardápio indisponível" (não há mais fallback embutido). É o trade-off pedido para reduzir memória.
- Imagens continuam servidas de `/public/assets/*` (permanecem no repo). O DB só guarda o caminho; se um dia migrar para CDN, basta atualizar o campo `image`.

## Detalhes técnicos

- `seed-products.json` passa a ser a fonte de verdade dos produtos iniciais. Todo item novo é criado pelo painel `/admin`.
- Server: nenhuma nova rota exigida além das já descritas em `BACKEND_FALTANDO.md`. O upsert usa `PUT /products/:id` quando `GET /products` já retorna o item pelo par `name+category`.
- Bundle: com `catalog.ts` enxuto o Vite deixa de resolver ~130 URLs de asset em cada build (economia de RAM no Nitro do Render).

Ao aprovar, executo as edições em uma única rodada e forneço o comando de seed para você rodar após o deploy.
