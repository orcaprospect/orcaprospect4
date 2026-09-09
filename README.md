# Orça Prospect 🔎💼

**Ferramenta de prospecção B2B para encontrar empresas com potencial de automação de orçamentos — feita para o [OrçaAI].**

O Orça Prospect permite buscar empresas por **segmento, cidade, estado, país e palavras-chave**, avalia o **Potencial de automação** de cada uma (score 0–100, estimado por sinais públicos), e organiza tudo em um **CRM simples** com leads, favoritos, tags, observações e **exportação em CSV**.

> ⚠️ **Postura ética/LGPD**: o sistema trabalha apenas com **informações empresariais públicas** obtidas de **APIs autorizadas** (Google Places, OpenStreetMap ou API própria). Não faz scraping abusivo, não envia mensagens automáticas, não cria banco falso de pessoas e não coleta dados pessoais desnecessários.

---

## Sumário

1. [O que é o projeto](#1-o-que-é-o-projeto)
2. [Tecnologias utilizadas](#2-tecnologias-utilizadas)
3. [Como instalar](#3-como-instalar)
4. [Como configurar o `.env`](#4-como-configurar-o-env)
5. [Como configurar o banco](#5-como-configurar-o-banco)
6. [Como configurar as APIs](#6-como-configurar-as-apis)
7. [Como executar localmente](#7-como-executar-localmente)
8. [Como fazer build](#8-como-fazer-build)
9. [Como fazer deploy (Vercel)](#9-como-fazer-deploy-vercel)
10. [Como conectar ao Supabase/PostgreSQL](#10-como-conectar-ao-supabasepostgresql)
11. [Como trocar o provider de empresas](#11-como-trocar-o-provider-de-empresas)
12. [Como ativar o modo demonstração](#12-como-ativar-o-modo-demonstração)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Score de potencial (como funciona)](#score-de-potencial-como-funciona)
- [Segurança](#segurança)
- [LGPD](#lgpd)
- [Solução de problemas](#solução-de-problemas)

---

## 1. O que é o projeto

O **OrçaAI** é um SaaS de criação e automação de orçamentos. O **Orça Prospect** é a ferramenta de prospecção que ajuda a encontrar **empresas que provavelmente trabalham com pedidos de orçamento** (marcenarias, serralherias, vidraçarias, clínicas, buffets etc.) e podem se beneficiar do produto.

Funcionalidades do MVP:

| Área | O que faz |
|---|---|
| **Landing page** | Página pública com hero, "Como funciona", recursos e CTA. |
| **Autenticação** | Registro/login próprios (senha com hash scrypt, sessão HttpOnly assinada) + conta de demonstração. |
| **Dashboard** | Visão geral: leads, favoritos, alto potencial, pipeline por status, pesquisas recentes e busca rápida. |
| **Encontrar empresas** | Busca por segmento/cidade/estado com fonte de dados **configurável** (providers). Estatísticas: empresas encontradas, leads de alto potencial, favoritos e contatos disponíveis. |
| **Score de potencial** | 0–100 com breakdown transparente por critério — sinaliza o que **não foi verificado** em vez de afirmar. |
| **Detalhe da empresa** | Modal com todos os dados, sinais encontrados, score detalhado e seção "Por que esta empresa pode ser um bom lead?". |
| **Leads (CRM)** | Kanban com 6 status (Novo → Contatado → Respondeu → Demonstração → Cliente / Sem interesse), drag & drop, notas, tags, favoritos, exclusão com confirmação, busca e filtros. |
| **Favoritos ("Meus leads")** | Empresas salvas como favoritas, com atalho para transformar em lead. |
| **Exportação** | CSV dos leads selecionados/filtrados, apenas com colunas comerciais. |
| **Configurações** | Perfil, senha, status das fontes de dados, privacidade (exportar/apagar meus dados). |

## 2. Tecnologias utilizadas

- **[Next.js 14](https://nextjs.org/)** (App Router, API Routes, Middleware) + **React 18**
- **TypeScript** (modo estrito) — `npm run typecheck`
- **Tailwind CSS 3.4** (design system próprio com componentes reutilizáveis em `components/ui`)
- **Zod** para validação de inputs (server e client)
- **lucide-react** (ícones) e **clsx** (classes)
- **Camada de persistência plugável**:
  - padrão: **arquivo JSON local** (`DATA_DIR`, zero configuração — dev/self-host);
  - produção: **PostgreSQL/Supabase** (`DATABASE_URL` — driver `pg` já incluído nas dependências) com **criação automática das tabelas** na primeira conexão.
- **Providers de dados modulares** (`providers/`): Google Places, OpenStreetMap, Demonstração e Custom (API própria).

> Por que Next.js? Deploy simples na Vercel, API Routes server-side (chaves de API **nunca** chegam ao navegador), SSR + responsividade e ecossistema maduro.

## 3. Como instalar

Requisitos: **Node.js ≥ 18.17** e npm.

```bash
# 1. Extraia o ZIP e entre na pasta
cd orca-prospect

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env.local   # e ajuste conforme a seção 4

# 4. Rode
npm run dev
```

Acesse **http://localhost:3000**. Crie sua conta em `/login` (aba "Criar conta") ou use a **conta de demonstração** (quando `DEMO_MODE=true`).

## 4. Como configurar o `.env`

Copie `.env.example` → `.env.local` (desenvolvimento) ou configure no painel da Vercel (produção). **Nenhum segredo vai para o repositório** (`.gitignore` já cobre `.env*`).

O mínimo para funcionar bem (deploy com Supabase — veja a [seção 10](#10-como-conectar-ao-supabasepostgresql) para o passo a passo de onde clicar):

```bash
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
SESSION_SECRET=cole-um-valor-aleatorio-aqui    # openssl rand -hex 32
DATABASE_URL=postgresql://postgres.xxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

Pronto: com `DATABASE_URL` definida, o app **usa o Postgres/Supabase e cria as tabelas automaticamente** na primeira execução (auto-migração). Nada de rodar SQL à mão.

> 💡 **E as chaves `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`?**
> Este app **não precisa delas**. Ele usa o Supabase como banco PostgreSQL direto do servidor (via `DATABASE_URL`, server-side apenas) e tem **autenticação própria** (e-mail e senha dentro do próprio app). URL e Anon Key só seriam necessárias se você usasse Supabase Auth/Storage no navegador — as variáveis opcionais já estão previstas no `.env.example` caso um dia queira integrar.

Variáveis completas:

```bash
# Aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=                # obrigatório em produção

# Banco
STORE=json                # json | postgres (opcional: com DATABASE_URL válida o Postgres é usado automaticamente)
DATABASE_URL=             # Connection String do Supabase ou de qualquer PostgreSQL
SUPABASE_DB_URL=          # alias opcional para a mesma string
DATA_DIR=.data            # apenas no modo JSON local

# Fontes de dados
DATA_PROVIDER=auto        # auto | google | osm | demo | custom | none
GOOGLE_MAPS_API_KEY=      # Places API (New) — server-side apenas
OSM_ENABLED=true          # APIs públicas gratuitas
DEMO_MODE=false           # true → empresas fictícias identificadas
CUSTOM_PROVIDER_URL=      # sua API (veja seção 11)
CUSTOM_PROVIDER_API_KEY=
SEARCH_MAX_RESULTS=60

# Opcionais (não usadas pelo app hoje)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Prioridade do `auto`: `demo` (se `DEMO_MODE=true`) → `google` (se houver chave) → `custom` (se houver URL) → `osm` (se habilitado). Sem nada configurado, a busca mostra: *"Fonte de dados não configurada. Configure uma API compatível para realizar pesquisas reais."*

## 5. Como configurar o banco

**Modo padrão (JSON local)** — não exige nada: os dados ficam em `DATA_DIR/orca-prospect.json` (gitignored). Ideal para desenvolvimento e self-hosting de processo único.

**Modo PostgreSQL/Supabase** — veja a seção 10.

Tabelas (conforme especificação): `users`, `companies`, `leads`, `favorites`, `searches`, `notes`, `tags` (+ `lead_tags`). Cada empresa tem identificador único (`external_key = provider:external_id`) e **deduplicação** dupla:

1. mesma fonte + id externo → **atualiza** o registro existente;
2. nome normalizado + cidade/UF equivalentes → **mescla entre fontes diferentes** (evita duplicatas Google vs. OSM);
3. `created_at` (data de coleta), `updated_at` (última atualização) e `last_seen_at` (última vez que a fonte retornou a empresa).

## 6. Como configurar as APIs

### Google Places (resultados mais completos)
1. No [Google Cloud Console](https://console.cloud.google.com/), crie/abra um projeto e habilite a **Places API (New)**.
2. Crie uma **API key** e restrinja-a (recomendado: restrição por IP/servidor).
3. Defina `GOOGLE_MAPS_API_KEY` **apenas no ambiente do servidor** (`.env.local` / Vercel). Ela nunca é enviada ao navegador.
4. Revise os [Termos do Google Maps Platform](https://cloud.google.com/maps-platform/terms) (atribuição, cache e armazenamento dos dados).
5. Custos: a Places API (New) tem cobrança por requisição — há crédito gratuito mensal; monitore no console.

### OpenStreetMap (gratuito, sem chave)
- Usa **Nominatim** (geocodificação da cidade) + **Overpass API** (empresas por tags) com `User-Agent` identificado, dentro das [políticas de uso](https://operations.osmfoundation.org/policies/nominatim/) oficiais — 1 req/s no Nominatim e consultas moderadas no Overpass (o app já aplica rate limit de 12 buscas/min/usuário).
- Limitação honesta: OSM **não informa** formulário de contato, sinais de orçamento etc. — esses critérios aparecem como "não verificado" no score.

### Provider customizado (API própria/contratada)
- `CUSTOM_PROVIDER_URL` + opcional `CUSTOM_PROVIDER_API_KEY` (vai no header `X-Api-Key`, server-side).
- Contrato esperado: `POST { segment, city, state, country, limit }` → `{ "companies": [ { externalId, name, category, city, state, website, phone, whatsapp, email, instagram, signals: {...}, ... } ] }`.
- Exemplo comentado: `providers/custom-provider.example.ts`.

## 7. Como executar localmente

```bash
npm install
cp .env.example .env.local    # opcional: ative DEMO_MODE=true para explorar sem APIs
npm run dev
```

- `http://localhost:3000` — landing page pública
- `/login` — entrar/criar conta (ou "Entrar com conta de demonstração")
- `/dashboard`, `/search`, `/leads`, `/favorites`, `/settings` — app (protegido por middleware + verificação server-side)
- `GET /api/health` — health check

## 8. Como fazer build

```bash
npm run build     # build de produção (já verificado sem erros)
npm run start     # serve o build (porta 3000)
npm run typecheck # TypeScript estrito sem erros
```

## 9. Como fazer deploy (Vercel)

O projeto está **preparado para a Vercel**:

1. Suba o repositório para GitHub/GitLab/Bitbucket e importe na [Vercel](https://vercel.com/new) (framework detectado: Next.js — sem configuração extra).
2. Configure as **variáveis de ambiente** no projeto (Production + Preview):
   - `SESSION_SECRET` (obrigatório — `openssl rand -hex 32`)
   - `NEXT_PUBLIC_APP_URL=https://seu-dominio.com`
   - `STORE=postgres` + `DATABASE_URL` (**importante**: o filesystem da Vercel é efêmero/readonly — **não use `STORE=json` em produção serverless**)
   - Fontes: `GOOGLE_MAPS_API_KEY` e/ou `OSM_ENABLED=true` e/ou `DEMO_MODE`
3. Deploy. Nenhuma chave fica no bundle do navegador (todas as chamadas a APIs externas acontecem em API Routes server-side).

## 10. Como conectar ao Supabase/PostgreSQL

```bash
# 1. Instale o driver
npm install pg

# 2. Aplique o schema (Supabase: SQL Editor → colar database/schema.sql → Run)
psql "$DATABASE_URL" -f database/schema.sql
#    ou no Supabase: Project Settings → Database → Connection string (use a "Pooler")

# 3. Ambiente
STORE=postgres
DATABASE_URL=postgresql://usuario:senha@host:5432/postgres

# 4. Reinicie
npm run build && npm run start
```

Notas:
- `lib/store/pg-store.ts` implementa a mesma interface `Store` do modo JSON — **nenhuma outra parte do código muda**.
- No Supabase, o acesso é server-side (API Routes). Se expor tabelas via PostgREST, habilite **RLS** (exemplos no final de `database/schema.sql`).

## 11. Como trocar o provider de empresas

Toda busca passa pela interface `DataProvider` (`providers/types.ts`):

```ts
interface DataProvider {
  id: string; label: string; envVars: string[]; description: string;
  configured(): boolean;
  search(query: ProviderQuery): Promise<ProviderResult>;
}
```

Para criar uma nova fonte:

1. Crie `providers/minha-fonte.ts` implementando `DataProvider` (converta a resposta para `RawCompany` — use `null` nos sinais que não conseguir verificar).
2. Registre em `providers/index.ts` (`resolveProvider` e `providerStatuses`).
3. (Opcional) Adicione variáveis de ambiente em `.env.example`.

Seleção por `DATA_PROVIDER=google|osm|demo|custom|none|auto`. Os providers incluídos:

| Provider | Arquivo | Requer | Observações |
|---|---|---|---|
| `demo` | `providers/demo.ts` | `DEMO_MODE=true` | Empresas **fictícias** identificadas ("DADOS DE DEMONSTRAÇÃO"). |
| `google` | `providers/google-places.ts` | `GOOGLE_MAPS_API_KEY` | Places API (New), server-side. |
| `osm` | `providers/openstreetmap.ts` | `OSM_ENABLED=true` | Nominatim + Overpass (APIs públicas permitidas; sem scraping). |
| `custom` | `providers/custom.ts` | `CUSTOM_PROVIDER_URL` | Sua API própria/contratada. |

## 12. Como ativar o modo demonstração

```bash
# .env.local
DEMO_MODE=true
# (opcional) force apenas o demo:
DATA_PROVIDER=demo
```

Reinicie com `npm run dev`. Em seguida:

- Banners **“DADOS DE DEMONSTRAÇÃO”** aparecem no app e nos cards;
- Os resultados são **empresas 100% fictícias** geradas localmente (nomes sempre contêm “Exemplo”/“Demonstração”, telefones são placeholders não discáveis `0000-0000`, domínios usam o TLD reservado `.invalid`);
- O login passa a oferecer a **conta de demonstração** (`demo@orcaprospect.local`, dados locais);
- **Nunca use `DEMO_MODE=true` fingindo ser dado real em produção.**

---

## Estrutura do projeto

```
orca-prospect/
├── app/                        # App Router (páginas + API Routes)
│   ├── page.tsx                # Landing page pública
│   ├── privacidade/            # Política de privacidade (LGPD)
│   ├── login/                  # Autenticação
│   ├── (app)/                  # Área autenticada (layout com sidebar)
│   │   ├── dashboard/  search/  leads/  favorites/  settings/
│   ├── api/                    # auth, search, companies, leads, favorites,
│   │                           # export, account, health
│   ├── layout.tsx  globals.css  icon.svg  error.tsx  not-found.tsx
├── components/
│   ├── ui/                     # Design system (Button, Input, Modal, Toast…)
│   ├── layout/                 # AppShell (sidebar/topbar), Logo
│   ├── shared/                 # CompanyCard, CompanyModal, ScoreBadge
│   ├── search/  leads/  favorites/  settings/  auth/
├── lib/
│   ├── score.ts                # Potencial de automação (0–100)
│   ├── auth.ts / auth-cookie.ts# Sessão HttpOnly assinada + scrypt
│   ├── store/                  # Store (interface) + JsonStore + PgStore
│   ├── validation.ts           # Schemas Zod
│   ├── csv.ts  hydrate.ts  api.ts  api-client.ts  env.ts
│   ├── segments.ts  rate-limit.ts  utils.ts
├── providers/                  # Camada de fontes de dados
│   ├── types.ts  index.ts
│   ├── google-places.ts  openstreetmap.ts  demo.ts  custom.ts
│   └── custom-provider.example.ts
├── database/
│   └── schema.sql              # DDL PostgreSQL/Supabase (7 tabelas + índices)
├── types/index.ts              # Tipos de domínio compartilhados
├── middleware.ts               # Proteção de rotas
├── .env.example  .gitignore  README.md
└── package.json  tsconfig.json  tailwind.config.ts  next.config.mjs
```

## Score de potencial (como funciona)

**“Potencial de automação” (0–100)** — *score estimado com base nos dados públicos disponíveis*. Ele **não afirma** que a empresa possui (ou não) automação; apenas mede aderência ao perfil do OrçaAI:

| Critério | Pontos |
|---|---|
| WhatsApp público | +20 |
| Site próprio | +15 |
| Formulário de contato | +15 |
| Sinais públicos de solicitação de orçamento | +20 |
| Catálogo de produtos/serviços | +10 |
| Instagram ativo | +10 |
| Segmento com orçamentos personalizados | +10 |

- **70–100**: Alto potencial · **40–69**: Potencial médio · **0–39**: Baixo potencial.
- Sinais que a fonte não consegue verificar aparecem como **“não verificado (n/v)”** — o sistema nunca afirma ausência sem evidência.
- O modal de detalhe mostra o breakdown completo e a seção **“Por que esta empresa pode ser um bom lead?”**.

## Segurança

- **Validação de inputs** com Zod em todas as rotas (mensagens em pt-BR) + sanitização (remoção de caracteres de controle, limites de tamanho).
- **Senhas** com `scrypt` + salt aleatório (módulo `crypto` do Node; comparação em tempo constante).
- **Sessão**: cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção, assinado com HMAC-SHA256 (`SESSION_SECRET`) e expiração de 30 dias.
- **Proteção de rotas**: `middleware.ts` (borda) + verificação de sessão em cada página/API (defesa em profundidade).
- **Autorização**: leads/favoritos/notas/pesquisas sempre filtrados por `user_id`; empresas são compartilhadas, dados de prospecção são isolados por usuário.
- **CSRF**: verificação de origem (`Origin` × `Host`) em todas as mutações + `SameSite`.
- **Segredos**: lidos exclusivamente server-side (`lib/env.ts`); nenhuma chave em `"use client"` ou `NEXT_PUBLIC_*`.
- **Rate limit** de buscas (respeita as APIs públicas).
- **Erros**: handlers padronizados (`lib/api.ts`), `error.tsx` global, mensagens amigáveis sem vazamento de stack.

## LGPD

- Finalidade legítima e declarada (prospecção B2B); **minimização**: apenas dados empresariais públicos e colunas comerciais na exportação.
- Sem disparo automático de mensagens; sem venda/compartilhamento de dados.
- Direitos do titular dentro do produto: **exportar meus dados** (JSON) e **apagar meus dados** em *Configurações → Privacidade*.
- Política de privacidade pública em `/privacidade`.
- Em produção, complete com DPO, base legal e revisão dos termos das fontes (Google Maps Platform, OSM).

## Solução de problemas

| Problema | Causa/solução |
|---|---|
| “Fonte de dados não configurada” | Nenhum provider ativo. Configure `GOOGLE_MAPS_API_KEY`, `OSM_ENABLED=true` ou `DEMO_MODE=true` e reinicie. |
| “Overpass está sob carga” | Instabilidade momentânea da API pública — aguarde e repita. |
| Busca OSM não acha a cidade | Verifique nome/UF; o OSM precisa de cidade **ou** estado para delimitar a área. |
| Erro 403 do Google | Habilite a **Places API (New)** e confira restrições/billing da chave. |
| `STORE=postgres` falha | Instale nada — o driver `pg` já vem incluído. Confira a `DATABASE_URL` (senha correta? host certo?). Erros comuns aparecem com mensagens amigáveis no app. |
| “password authentication failed” | Senha do banco errada na `DATABASE_URL`. No Supabase: *Settings → Database → Reset database password*, atualize a URL. |
| Tabelas não apareceram no Supabase | Elas são criadas na **primeira requisição** após conectar. Faça um login/busca e atualize o Table Editor. |
| Dados sumiram no deploy Vercel | Filesystem efêmero — use `STORE=postgres`. |

---

Feito com ❤️ para o **OrçaAI**. MVP funcional — contribua criando novos providers em `providers/`.
