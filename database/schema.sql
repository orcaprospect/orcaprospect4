-- ============================================================
-- Orça Prospect — schema PostgreSQL / Supabase
-- ============================================================
-- OBSERVAÇÃO: você NÃO precisa rodar este arquivo manualmente.
-- Na primeira conexão com DATABASE_URL o aplicativo cria as
-- tabelas automaticamente (mesmo DDL embutido em lib/store/pg-schema.ts).
--
-- Para rodar manualmente (opcional):
--   Supabase: SQL Editor → cole este arquivo → Run.
--   psql:     psql "$DATABASE_URL" -f database/schema.sql
-- ============================================================

create extension if not exists "pgcrypto";

-- Usuários da aplicação (autenticação própria do MVP)
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Empresas (compartilhadas entre usuários, com deduplicação)
create table if not exists companies (
  id               uuid primary key default gen_random_uuid(),
  provider         text not null,                    -- google | osm | demo | custom
  external_id      text not null,                    -- id na fonte
  external_key     text not null unique,             -- provider:external_id
  name             text not null,
  normalized_name  text not null default '',         -- nome sem acento/pontuação (dedupe)
  normalized_city  text not null default '',         -- cidade normalizada (dedupe)
  normalized_state text not null default '',         -- UF normalizada (dedupe)
  category         text,
  city             text,
  state            text,
  country          text,
  address          text,
  website          text,
  instagram        text,
  phone            text,
  whatsapp         text,
  email            text,
  description      text,
  services         jsonb   not null default '[]',
  signals          jsonb   not null default '{}',    -- sinais verificados pela fonte
  source_url       text,
  created_at       timestamptz not null default now(),  -- "data de coleta"
  updated_at       timestamptz not null default now(),  -- última atualização
  last_seen_at     timestamptz not null default now()
);

create index if not exists companies_dedupe_idx
  on companies (normalized_name, normalized_city, normalized_state);

-- Favoritos ("Meus leads" salvos)
create table if not exists favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);

-- Leads (CRM)
create table if not exists leads (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  company_id     uuid not null references companies(id) on delete cascade,
  status         text not null default 'novo'
                 check (status in ('novo','contatado','respondeu','demonstracao','cliente','sem_interesse')),
  favorite       boolean not null default false,
  score_snapshot integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, company_id)
);

-- Tags do lead (jsonb)
alter table leads add column if not exists tags jsonb not null default '[]';

create index if not exists leads_user_idx on leads (user_id, updated_at desc);

-- Tags (dicionário por usuário) e vínculo com leads
create table if not exists tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists lead_tags (
  lead_id uuid not null references leads(id) on delete cascade,
  tag_id  uuid not null references tags(id) on delete cascade,
  primary key (lead_id, tag_id)
);

-- Observações dos leads
create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_lead_idx on notes (lead_id, created_at);

-- Histórico de pesquisas
create table if not exists searches (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  segment      text not null,
  city         text,
  state        text,
  country      text,
  provider     text,
  result_count integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists searches_user_idx on searches (user_id, created_at desc);

-- ============================================================
-- Notas sobre Supabase:
-- - O MVP acessa o Postgres com a Connection String a partir das
--   API Routes (server-side apenas), mantendo o isolamento por
--   user_id na camada de aplicação.
-- - A Supabase URL / Anon Key NÃO são usadas por este app (a
--   autenticação é própria). Elas só seriam necessárias para
--   integrações adicionais (Supabase Auth, Storage etc.).
-- - Se você expuser tabelas via PostgREST, HABILITE RLS e crie
--   policies por user_id. Exemplo:
--
--     alter table leads enable row level security;
--     create policy "own leads" on leads
--       for all using (user_id = auth.uid());
-- ============================================================
