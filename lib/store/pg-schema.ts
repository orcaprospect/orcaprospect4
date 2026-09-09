/**
 * DDL idempotente do banco PostgreSQL/Supabase.
 *
 * É aplicado AUTOMATICAMENTE na primeira conexão (auto-migração):
 * você só precisa definir DATABASE_URL — as tabelas são criadas
 * sozinhas. O arquivo `database/schema.sql` é a referência do
 * mesmo schema (para rodar manualmente no SQL Editor do Supabase).
 */
export const PG_SCHEMA_SQL = /* sql */ `
create extension if not exists pgcrypto;

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists companies (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,
  external_id     text not null,
  external_key    text not null unique,
  name            text not null,
  normalized_name text not null default '',
  normalized_city text not null default '',
  normalized_state text not null default '',
  category        text,
  city            text,
  state           text,
  country         text,
  address         text,
  website         text,
  instagram       text,
  phone           text,
  whatsapp        text,
  email           text,
  description     text,
  services        jsonb   not null default '[]',
  signals         jsonb   not null default '{}',
  source_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);

create index if not exists companies_dedupe_idx
  on companies (normalized_name, normalized_city, normalized_state);

create table if not exists favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);

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

-- Tags do lead (jsonb). Migração p/ bancos criados antes desta coluna.
alter table leads add column if not exists tags jsonb not null default '[]';
update leads set tags = '[]'::jsonb where tags is null;

create index if not exists leads_user_idx on leads (user_id, updated_at desc);

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

create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_lead_idx on notes (lead_id, created_at);

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
`;
