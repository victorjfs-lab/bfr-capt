# BFR CAPT

Site de captura da BFR Investimentos com landing page, video e chamada para o formulario de diagnostico de perfil de investidor.

## Stack

- React 19
- TanStack Router / TanStack Start
- Vite
- Tailwind CSS
- Node.js 22+
- pnpm
- MySQL em producao / SQLite no desenvolvimento local

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

## Deploy na Hostinger

Requer o plano Business Web Hosting ou um plano Cloud com suporte a aplicacoes
Node.js. No hPanel, selecione `Websites > Add Website > Deploy Web App`, conecte
o repositorio GitHub e use:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Crie um banco em `Databases > MySQL Databases` e cadastre estas variaveis no
deploy da aplicacao:

```bash
ADMIN_PASSWORD=uma-senha-forte
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario_do_banco
DB_PASSWORD=senha_do_banco
DB_NAME=nome_do_banco
```

`ADMIN_PASSWORD` e a senha principal das paginas `/admin`, `/inscritos` e
`/validacao`. Depois do primeiro login, uma sessao segura mantem essas paginas
autenticadas no mesmo navegador. A tabela `leads` e criada automaticamente no
primeiro cadastro ou acesso ao painel. Consulte `.env.example`.

## Formulario

O formulario salva Nome, WhatsApp e E-mail no MySQL da Hostinger em producao e
em SQLite durante o desenvolvimento local. Depois do cadastro, o visitante e
encaminhado para o WhatsApp `+55 41 9192-0291`.

## Area administrativa

Acesse `/admin` com a senha definida em `ADMIN_PASSWORD` para acompanhar a
operacao completa. As paginas `/inscritos` e `/validacao` compartilham a mesma
sessao persistente.

## Convites e mini curso

O fluxo de entrega usa tres paginas:

- `/validacao`: a equipe informa o e-mail captado na landing page e gera um
  link individual protegido. Depois libera o acesso do aluno com um clique.
- `/inscricao?convite=TOKEN`: o cliente confirma nome e o mesmo e-mail usado na
  landing page.
- `/curso?convite=TOKEN`: o treinamento so abre quando o convite esta aprovado.

Se o e-mail nao existir na landing page ou divergir na inscricao protegida, o
sistema retorna `Usuário não encontrado, confirmar E-mail.`.

## Entrega automatica da compra Hotmart

Cadastre na Hotmart o webhook abaixo, versao `2.0.0`, para os eventos de compra
aprovada, compra completa, cancelamento, reembolso e chargeback:

```text
https://nexum.fluxosimplificado.com/api/hotmart
```

O webhook valida o `X-HOTMART-HOTTOK`, registra a transacao no banco e envia ao
comprador um link individual para baixar o indicador. Eventos de cancelamento,
reembolso e chargeback revogam o download. Configure no deploy da Hostinger as
variaveis `HOTMART_HOTTOK`, `PUBLIC_SITE_URL`, `SMTP_HOST`, `SMTP_PORT`,
`SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_NAME` e
`SMTP_FROM_EMAIL`. `HOTMART_PRODUCT_ID` e opcional e restringe a entrega a um
produto especifico.
