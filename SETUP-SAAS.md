# Guia de configuração do modo SaaS

O app funciona em **dois modos**:

- **Local** (padrão, sem configuração): os dados ficam só no navegador. É o
  `Controle-Financeiro.html` que abre com duplo clique, offline.
- **SaaS** (nuvem): login por e-mail/senha, dados salvos na nuvem por usuário e
  acesso liberado por **assinatura paga (Stripe)**. Ativado automaticamente
  quando as variáveis de ambiente do Supabase estão presentes no build.

Siga os passos abaixo para ligar o modo SaaS. Tempo estimado: ~30–45 min.

---

## 1. Criar o projeto no Supabase

1. Crie uma conta grátis em <https://supabase.com> e um novo projeto.
2. Em **Project Settings → API**, anote:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. Em **SQL Editor**, cole e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   Isso cria as tabelas `financeiro_estado`, `stripe_customers` e `subscriptions`
   com as regras de segurança (cada usuário só enxerga os próprios dados).
4. (Opcional) Em **Authentication → Providers → Email**, você pode desativar
   "Confirm email" durante os testes para entrar sem confirmar o e-mail.

## 2. Criar o produto e o preço no Stripe

1. Crie uma conta em <https://stripe.com>.
2. Em **Products**, crie um produto (ex.: "Controle Financeiro Pro") com um
   **preço recorrente** (ex.: R$ 29/mês).
3. Copie o **ID do preço** (começa com `price_...`) → `VITE_STRIPE_PRICE_ID`.
4. Em **Developers → API keys**, copie a **Secret key** (`sk_...`).

## 3. Publicar as Edge Functions (checkout + webhook)

Instale a [CLI do Supabase](https://supabase.com/docs/guides/cli) e rode:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF

# segredos usados pelas funções
supabase secrets set STRIPE_SECRET_KEY=sk_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx   # preenchido no passo 4

supabase functions deploy create-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetados automaticamente
> nas funções — não precisa defini-los.

## 4. Ligar o webhook do Stripe

1. Em **Developers → Webhooks → Add endpoint**, use a URL da função:
   `https://SEU_PROJECT_REF.functions.supabase.co/stripe-webhook`
2. Assine os eventos:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`.
3. Copie o **Signing secret** (`whsec_...`) e rode
   `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx` (depois redeploy da
   função `stripe-webhook`).

## 5. Configurar o front-end

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-publica
VITE_STRIPE_PRICE_ID=price_xxx
```

Rode localmente:

```bash
npm install
npm run dev
```

Se as variáveis estiverem presentes, o app abre na **tela de login**.

## 6. Publicar o site (Vercel/Netlify)

1. Suba o repositório e importe no **Vercel** (ou Netlify).
2. Nas **Environment Variables** do projeto, cadastre as três `VITE_...`.
3. Deploy. Use a URL final como domínio do seu SaaS.

> Ajuste o `base` em `vite.config.ts` conforme a hospedagem: para domínio
> próprio ou Vercel use `base: '/'`; para GitHub Pages de projeto mantenha
> `/dimensionamento-cabos-nbr5410/`.

---

## Como funciona (resumo técnico)

- **Auth**: Supabase Auth (e-mail/senha). Sessão persiste no navegador.
- **Dados**: tabela `financeiro_estado` (1 linha JSON por usuário), protegida por
  Row Level Security — cada usuário só lê/grava a própria linha.
- **Cobrança**: `create-checkout` cria a sessão do Stripe; após o pagamento, o
  `stripe-webhook` grava o status em `subscriptions`. O app libera o acesso
  quando o status é `active`/`trialing`.
- **Segurança**: a `service role key` fica **apenas** nas Edge Functions
  (servidor). O front usa só a `anon key` pública.

## Ideias de evolução

- Período de teste grátis (trial) no preço do Stripe.
- Portal do cliente do Stripe para o usuário gerenciar/cancelar a assinatura.
- Planos diferentes (Básico/Pro) com limites por plano.
- Recuperação de senha e login social (Google).
