# BFR CAPT

Site de captura da BFR Investimentos com landing page, video e chamada para o formulario de diagnostico de perfil de investidor.

## Stack

- React 19
- TanStack Router / TanStack Start
- Vite
- Tailwind CSS
- Node.js 22+
- pnpm

## Rodar localmente

```bash
pnpm install
pnpm dev
```

## Build de producao

```bash
pnpm build
pnpm start
```

O comando `pnpm start` executa o servidor gerado em `.output/server/index.mjs`.

## Deploy Node.js

Use estes comandos em uma hospedagem Node.js:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Variaveis de ambiente nao sao obrigatorias para a versao atual.

## Formulario

Os botoes do site apontam para o Google Forms publicado:

https://docs.google.com/forms/d/e/1FAIpQLSfCBEBTEwAuPjCNSmVP1RPRag18ZM4_9Edh06aoEMulsxTdww/viewform
