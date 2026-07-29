-- =====================================================================
-- Controle Financeiro — esquema do banco (Supabase / Postgres)
-- Rode este script uma vez no SQL Editor do seu projeto Supabase.
-- =====================================================================

-- Estado financeiro: uma linha por usuário (o app grava tudo em JSON).
create table if not exists public.financeiro_estado (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  dados      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.financeiro_estado enable row level security;

drop policy if exists "estado_dono_seleciona" on public.financeiro_estado;
create policy "estado_dono_seleciona" on public.financeiro_estado
  for select using (auth.uid() = user_id);

drop policy if exists "estado_dono_insere" on public.financeiro_estado;
create policy "estado_dono_insere" on public.financeiro_estado
  for insert with check (auth.uid() = user_id);

drop policy if exists "estado_dono_atualiza" on public.financeiro_estado;
create policy "estado_dono_atualiza" on public.financeiro_estado
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mapa usuário <-> cliente Stripe (acesso apenas pela service role / webhook).
create table if not exists public.stripe_customers (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  customer_id text unique not null,
  created_at  timestamptz not null default now()
);

alter table public.stripe_customers enable row level security;
-- Sem policies públicas: só as Edge Functions (service role) acessam.

-- Assinaturas: mantida pelo webhook do Stripe.
create table if not exists public.subscriptions (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  customer_id        text,
  subscription_id    text,
  status             text not null default 'inactive',
  price_id           text,
  current_period_end timestamptz,
  updated_at         timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- O usuário pode LER a própria assinatura; a escrita é só via webhook.
drop policy if exists "assinatura_dono_seleciona" on public.subscriptions;
create policy "assinatura_dono_seleciona" on public.subscriptions
  for select using (auth.uid() = user_id);
