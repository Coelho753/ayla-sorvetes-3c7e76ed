# Deploy no Render

Este projeto está pronto para ser publicado no [Render](https://render.com) como **Static Site**.

## Passo a passo (super fácil)

### Opção 1 — Via Blueprint (recomendado, 1 clique)

1. Faça push do código para um repositório no GitHub.
2. No Render, clique em **New +** → **Blueprint**.
3. Conecte o repositório. O Render vai detectar o arquivo `render.yaml` automaticamente.
4. Clique em **Apply**. Pronto! 🎉

### Opção 2 — Manual

1. No Render, clique em **New +** → **Static Site**.
2. Conecte seu repositório GitHub.
3. Preencha:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist/client`
4. Em **Redirects/Rewrites**, adicione:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
5. Clique em **Create Static Site**.

## Atualizações automáticas

Toda vez que você fizer push para a branch principal (main), o Render fará o deploy automaticamente.

## Domínio personalizado

Em **Settings → Custom Domains**, adicione seu domínio e siga as instruções de DNS.
