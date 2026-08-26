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

Configure as variaveis de ambiente antes de iniciar o servidor:

```bash
ADMIN_PASSWORD=uma-senha-forte
LEADS_DB_PATH=/caminho/persistente/leads.sqlite
```

`ADMIN_PASSWORD` protege a pagina `/inscritos`. `LEADS_DB_PATH` deve apontar
para um volume persistente da hospedagem para que os cadastros sobrevivam a
novos deploys. Consulte `.env.example`.

## Formulario

O formulario salva Nome, WhatsApp e E-mail em SQLite no servidor. Depois do
cadastro, o visitante e encaminhado para o WhatsApp `+55 51 3376-5598`.

## Area administrativa

Acesse `/inscritos`, informe a senha definida em `ADMIN_PASSWORD` e consulte,
pesquise ou exporte a lista de inscritos em CSV.
