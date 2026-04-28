# 🚀 Deploy no Render

Este projeto está pronto para publicar no [Render](https://render.com) com 1 clique.

## Opção 1 — Blueprint automático (recomendado)

1. Suba o código para um repositório no **GitHub**.
2. No Render, clique em **New +** → **Blueprint**.
3. Conecte o repositório. O Render detecta o `render.yaml` sozinho.
4. Clique em **Apply**. Pronto! 🎉

## Opção 2 — Manual (Web Service)

1. No Render, clique em **New +** → **Web Service**.
2. Conecte seu repositório GitHub.
3. Preencha:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** 20 (em Environment, adicione `NODE_VERSION=20`)
4. Clique em **Create Web Service**.

## Como funciona

- `npm run build` gera a versão de produção (cliente em `dist/client` e SSR em `dist/server`).
- `npm start` roda `server.js`, um servidor Node leve que serve os assets estáticos e faz SSR via o handler do TanStack Start.
- O Render injeta a porta automaticamente via `PORT`.

## Atualizações automáticas

Cada `git push` na branch principal dispara um novo deploy.

## Domínio personalizado

Em **Settings → Custom Domains**, adicione seu domínio e configure os DNS conforme indicado pelo Render.
