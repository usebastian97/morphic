-- ============================================================
-- 001 - SwissTaxSearch destructive schema reset
-- Rebuilds Morphic for official-only Swiss tax search.
-- ============================================================

-- Existing projects: run this migration deliberately. It drops all app-owned
-- public tables from the previous product schema and rebuilds them for
-- SwissTaxSearch. Supabase Auth tables are not dropped.

drop trigger if exists on_auth_user_created on auth.users;


drop table if exists public.credit_ledger cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.tax_alert_subscriptions cascade;
drop table if exists public.alert_subscriptions cascade;
drop table if exists public.trending_tax_queries cascade;
drop table if exists public.trending_queries cascade;
drop table if exists public.tax_search_events cascade;
drop table if exists public.search_events cascade;
drop table if exists public.source_tax_topics cascade;
drop table if exists public.source_topics cascade;
drop table if exists public.official_sources cascade;
drop table if exists public.sources cascade;
drop table if exists public.chat_tax_topics cascade;
drop table if exists public.chat_topics cascade;
drop table if exists public.tax_topics cascade;
drop table if exists public.topics cascade;
drop table if exists public.bookmarks cascade;
drop table if exists public.collections cascade;
drop table if exists public.parts cascade;
drop table if exists public.messages cascade;
drop table if exists public.chats cascade;
drop table if exists public.feedback cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.swiss_cantons cascade;

drop function if exists public.increment_search_count(uuid) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.sync_subscription_tier() cascade;
drop function if exists public.deduct_credits(uuid, integer, text, text, text) cascade;
drop function if exists public.set_updated_at() cascade;

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Swiss jurisdiction reference data
-- ------------------------------------------------------------
create table public.swiss_cantons (
  code             text primary key
                   check (code in (
                     'AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE',
                     'NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'
                   )),
  name_de          text not null,
  name_fr          text not null,
  name_it          text not null,
  name_en          text not null,
  official_domain  text not null,
  tax_office_url   text,
  languages        text[] not null default '{de}',
  created_at       timestamptz not null default now()
);

alter table public.swiss_cantons enable row level security;
create policy "swiss_cantons_select_all" on public.swiss_cantons
  for select using (true);
grant select on public.swiss_cantons to authenticated, anon;

-- ------------------------------------------------------------
-- User profiles
-- ------------------------------------------------------------
create table public.user_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text,
  avatar_url            text,
  bio                   text,

  canton_code           text references public.swiss_cantons(code) on delete set null,
  municipality          text,
  taxpayer_type         text not null default 'individual'
                         check (taxpayer_type in (
                           'individual', 'self_employed', 'business',
                           'expat', 'advisor', 'institution'
                         )),
  preferred_language    text not null default 'en'
                         check (preferred_language in ('de', 'fr', 'it', 'en')),

  subscription_tier     text not null default 'free'
                         check (subscription_tier in ('free', 'pro', 'plus', 'max')),

  onboarding_completed  boolean not null default false,
  last_seen_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index user_profiles_canton_idx on public.user_profiles (canton_code);
create index user_profiles_taxpayer_type_idx on public.user_profiles (taxpayer_type);

alter table public.user_profiles enable row level security;
create policy "profiles_select_own" on public.user_profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.user_profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.user_profiles
  for update using (auth.uid() = id);
grant select, insert, update on public.user_profiles to authenticated;

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Core chat tables
-- ------------------------------------------------------------
create table public.chats (
  id          text primary key,
  user_id     text not null,
  title       text not null,
  visibility  text not null default 'private' check (visibility in ('public', 'private')),
  created_at  timestamptz not null default now()
);

alter table public.chats enable row level security;
create policy "chats_select_own_or_public" on public.chats
  for select using (auth.uid()::text = user_id or visibility = 'public');
create policy "chats_insert_own" on public.chats
  for insert with check (auth.uid()::text = user_id);
create policy "chats_update_own" on public.chats
  for update using (auth.uid()::text = user_id);
create policy "chats_delete_own" on public.chats
  for delete using (auth.uid()::text = user_id);
grant select, insert, update, delete on public.chats to authenticated;
grant select on public.chats to anon;

create table public.messages (
  id          text primary key,
  chat_id     text not null references public.chats(id) on delete cascade,
  role        text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index messages_chat_id_idx on public.messages (chat_id);

alter table public.messages enable row level security;
create policy "messages_select_via_chat" on public.messages
  for select using (
    exists (
      select 1 from public.chats
      where id = chat_id
        and (auth.uid()::text = user_id or visibility = 'public')
    )
  );
create policy "messages_insert_own" on public.messages
  for insert with check (
    exists (
      select 1 from public.chats
      where id = chat_id and auth.uid()::text = user_id
    )
  );
create policy "messages_update_own" on public.messages
  for update using (
    exists (
      select 1 from public.chats
      where id = chat_id and auth.uid()::text = user_id
    )
  );
create policy "messages_delete_own" on public.messages
  for delete using (
    exists (
      select 1 from public.chats
      where id = chat_id and auth.uid()::text = user_id
    )
  );
grant select, insert, update, delete on public.messages to authenticated;
grant select on public.messages to anon;

create table public.parts (
  id                          text primary key default gen_random_uuid()::text,
  message_id                  text not null references public.messages(id) on delete cascade,
  "order"                     integer not null,
  type                        text not null,
  text_text                   text,
  reasoning_text              text,
  file_media_type             text,
  file_filename               text,
  file_url                    text,
  source_url_source_id        text,
  source_url_url              text,
  source_url_title            text,
  source_document_source_id   text,
  source_document_media_type  text,
  source_document_title       text,
  source_document_filename    text,
  source_document_url         text,
  source_document_snippet     text,
  tool_tool_call_id           text,
  tool_state                  text,
  tool_error_text             text,
  tool_search_input           jsonb,
  tool_search_output          jsonb,
  tool_fetch_input            jsonb,
  tool_fetch_output           jsonb,
  tool_question_input         jsonb,
  tool_question_output        jsonb,
  "tool_todoWrite_input"      jsonb,
  "tool_todoWrite_output"     jsonb,
  "tool_todoRead_input"       jsonb,
  "tool_todoRead_output"      jsonb,
  tool_dynamic_input          jsonb,
  tool_dynamic_output         jsonb,
  tool_dynamic_name           text,
  tool_dynamic_type           text,
  data_prefix                 text,
  data_content                jsonb,
  data_id                     text,
  provider_metadata           jsonb,
  created_at                  timestamptz not null default now()
);

create index parts_message_id_idx on public.parts (message_id);
create index parts_message_order_idx on public.parts (message_id, "order");

alter table public.parts enable row level security;
create policy "parts_select_via_chat" on public.parts
  for select using (
    exists (
      select 1 from public.messages m
      join public.chats c on c.id = m.chat_id
      where m.id = message_id
        and (auth.uid()::text = c.user_id or c.visibility = 'public')
    )
  );
create policy "parts_insert_own" on public.parts
  for insert with check (
    exists (
      select 1 from public.messages m
      join public.chats c on c.id = m.chat_id
      where m.id = message_id and auth.uid()::text = c.user_id
    )
  );
create policy "parts_delete_own" on public.parts
  for delete using (
    exists (
      select 1 from public.messages m
      join public.chats c on c.id = m.chat_id
      where m.id = message_id and auth.uid()::text = c.user_id
    )
  );
grant select, insert, update, delete on public.parts to authenticated;
grant select on public.parts to anon;

create table public.feedback (
  id          text primary key,
  user_id     text,
  sentiment   text not null check (sentiment in ('positive', 'neutral', 'negative')),
  message     text not null,
  page_url    text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;
create policy "feedback_insert_any" on public.feedback
  for insert with check (true);
create policy "feedback_select_own" on public.feedback
  for select using (auth.uid()::text = user_id);
grant insert on public.feedback to anon;
grant select, insert on public.feedback to authenticated;

-- ------------------------------------------------------------
-- Swiss tax taxonomy and official source catalogue
-- ------------------------------------------------------------
create table public.tax_topics (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  name_de     text,
  name_fr     text,
  name_it     text,
  name_en     text,
  description text,
  parent_id   uuid references public.tax_topics(id) on delete set null,
  icon        text,
  color       text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index tax_topics_parent_idx on public.tax_topics (parent_id);
create index tax_topics_slug_idx on public.tax_topics (slug);
create index tax_topics_active_idx on public.tax_topics (is_active) where is_active = true;

alter table public.tax_topics enable row level security;
create policy "tax_topics_select_active" on public.tax_topics
  for select using (is_active = true);
grant select on public.tax_topics to authenticated, anon;

create table public.chat_tax_topics (
  chat_id     text not null references public.chats(id) on delete cascade,
  topic_id    uuid not null references public.tax_topics(id) on delete cascade,
  confidence  numeric check (confidence between 0 and 1),
  primary key (chat_id, topic_id)
);

alter table public.chat_tax_topics enable row level security;
create policy "chat_tax_topics_select" on public.chat_tax_topics
  for select using (
    exists (
      select 1 from public.chats
      where id = chat_id
        and (auth.uid()::text = user_id or visibility = 'public')
    )
  );
create policy "chat_tax_topics_insert_own" on public.chat_tax_topics
  for insert with check (
    exists (
      select 1 from public.chats
      where id = chat_id and auth.uid()::text = user_id
    )
  );
create policy "chat_tax_topics_delete_own" on public.chat_tax_topics
  for delete using (
    exists (
      select 1 from public.chats
      where id = chat_id and auth.uid()::text = user_id
    )
  );
grant select, insert, delete on public.chat_tax_topics to authenticated;

create table public.official_sources (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  base_url            text not null,
  domain              text not null,
  description         text,
  logo_url            text,
  jurisdiction_level  text not null
                       check (jurisdiction_level in ('federal', 'canton', 'municipality')),
  canton_code         text references public.swiss_cantons(code) on delete set null,
  municipality        text,
  source_type         text not null
                       check (source_type in (
                         'tax_authority', 'official_portal', 'legal_database',
                         'official_news', 'statistics', 'forms'
                       )),
  languages           text[] not null default '{de}',
  trust_score         integer not null default 90 check (trust_score between 0 and 100),
  is_active           boolean not null default true,
  is_featured         boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index official_sources_active_idx on public.official_sources (is_active) where is_active = true;
create index official_sources_featured_idx on public.official_sources (is_featured) where is_featured = true;
create index official_sources_domain_idx on public.official_sources (domain);
create index official_sources_canton_idx on public.official_sources (canton_code);
create index official_sources_type_idx on public.official_sources (source_type);

alter table public.official_sources enable row level security;
create policy "official_sources_select_active" on public.official_sources
  for select using (is_active = true);
grant select on public.official_sources to authenticated, anon;

create trigger official_sources_set_updated_at
  before update on public.official_sources
  for each row execute function public.set_updated_at();

create table public.source_tax_topics (
  source_id  uuid not null references public.official_sources(id) on delete cascade,
  topic_id   uuid not null references public.tax_topics(id) on delete cascade,
  primary key (source_id, topic_id)
);

alter table public.source_tax_topics enable row level security;
create policy "source_tax_topics_select" on public.source_tax_topics
  for select using (true);
grant select on public.source_tax_topics to authenticated, anon;

-- ------------------------------------------------------------
-- Saved searches
-- ------------------------------------------------------------
create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  icon        text,
  color       text,
  is_public   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index collections_user_idx on public.collections (user_id);

alter table public.collections enable row level security;
create policy "collections_select_own_or_public" on public.collections
  for select using (auth.uid() = user_id or is_public = true);
create policy "collections_insert_own" on public.collections
  for insert with check (auth.uid() = user_id);
create policy "collections_update_own" on public.collections
  for update using (auth.uid() = user_id);
create policy "collections_delete_own" on public.collections
  for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.collections to authenticated;

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create table public.bookmarks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  collection_id  uuid references public.collections(id) on delete set null,
  chat_id        text references public.chats(id) on delete cascade,
  url            text,
  title          text,
  description    text,
  thumbnail_url  text,
  notes          text,
  tags           text[] not null default '{}',
  created_at     timestamptz not null default now(),
  constraint bookmarks_has_target check (chat_id is not null or url is not null)
);

create index bookmarks_user_idx on public.bookmarks (user_id);
create index bookmarks_collection_idx on public.bookmarks (collection_id);
create index bookmarks_chat_idx on public.bookmarks (chat_id);
create index bookmarks_tags_idx on public.bookmarks using gin (tags);

alter table public.bookmarks enable row level security;
create policy "bookmarks_select_own" on public.bookmarks
  for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.bookmarks
  for insert with check (auth.uid() = user_id);
create policy "bookmarks_update_own" on public.bookmarks
  for update using (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.bookmarks
  for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.bookmarks to authenticated;

-- ------------------------------------------------------------
-- Analytics and alerts
-- ------------------------------------------------------------
create table public.tax_search_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  query             text not null,
  chat_id           text references public.chats(id) on delete set null,
  tax_topic_ids     uuid[] not null default '{}',
  providers_used    text[] not null default '{}',
  result_count      integer,
  latency_ms        integer,
  country_code      text,
  canton_code       text references public.swiss_cantons(code) on delete set null,
  municipality      text,
  taxpayer_type     text,
  platform          text,
  has_engagement    boolean not null default false,
  created_at        timestamptz not null default now()
);

create index tax_search_events_query_trgm_idx on public.tax_search_events using gin (query gin_trgm_ops);
create index tax_search_events_created_at_idx on public.tax_search_events (created_at desc);
create index tax_search_events_user_idx on public.tax_search_events (user_id);
create index tax_search_events_topics_gin_idx on public.tax_search_events using gin (tax_topic_ids);
create index tax_search_events_canton_idx on public.tax_search_events (canton_code);

alter table public.tax_search_events enable row level security;
create policy "tax_search_events_select_own" on public.tax_search_events
  for select using (auth.uid() = user_id);
create policy "tax_search_events_insert_any" on public.tax_search_events
  for insert with check (true);
grant insert on public.tax_search_events to anon;
grant select, insert on public.tax_search_events to authenticated;

create table public.trending_tax_queries (
  id             uuid primary key default gen_random_uuid(),
  query          text not null,
  tax_topic_id   uuid references public.tax_topics(id) on delete set null,
  period         text not null default 'daily' check (period in ('daily', 'weekly', 'monthly')),
  query_count    integer not null default 0,
  country_code   text,
  canton_code    text references public.swiss_cantons(code) on delete set null,
  computed_at    timestamptz not null default now()
);

create index trending_tax_period_idx on public.trending_tax_queries (period);
create index trending_tax_topic_idx on public.trending_tax_queries (tax_topic_id);
create index trending_tax_count_idx on public.trending_tax_queries (query_count desc);
create index trending_tax_canton_idx on public.trending_tax_queries (canton_code);

alter table public.trending_tax_queries enable row level security;
create policy "trending_tax_select_all" on public.trending_tax_queries
  for select using (true);
grant select on public.trending_tax_queries to authenticated, anon;

create table public.tax_alert_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  alert_type    text not null
                 check (alert_type in (
                   'deadline', 'law_change', 'rate_change',
                   'form_update', 'official_news', 'guidance_update'
                 )),
  tax_topic_id  uuid references public.tax_topics(id) on delete set null,
  keywords      text[] not null default '{}',
  canton_codes  text[] not null default '{}',
  channels      text[] not null default '{email}',
  frequency     text not null default 'daily' check (frequency in ('immediate', 'daily', 'weekly')),
  webhook_url   text,
  is_active     boolean not null default true,
  last_sent_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index tax_alerts_user_idx on public.tax_alert_subscriptions (user_id);
create index tax_alerts_type_idx on public.tax_alert_subscriptions (alert_type);
create index tax_alerts_topic_idx on public.tax_alert_subscriptions (tax_topic_id);
create index tax_alerts_active_idx on public.tax_alert_subscriptions (is_active) where is_active = true;

alter table public.tax_alert_subscriptions enable row level security;
create policy "tax_alerts_select_own" on public.tax_alert_subscriptions
  for select using (auth.uid() = user_id);
create policy "tax_alerts_insert_own" on public.tax_alert_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "tax_alerts_update_own" on public.tax_alert_subscriptions
  for update using (auth.uid() = user_id);
create policy "tax_alerts_delete_own" on public.tax_alert_subscriptions
  for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.tax_alert_subscriptions to authenticated;

create trigger tax_alerts_set_updated_at
  before update on public.tax_alert_subscriptions
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Subscriptions and credits
-- ------------------------------------------------------------
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  tier                   text not null default 'free' check (tier in ('free', 'pro', 'plus', 'max')),
  monthly_credits        integer not null default 20,
  credits_balance        integer not null default 20,
  rollover_credits       integer not null default 0,
  topup_credits          integer not null default 0,
  current_period_start   timestamptz not null default now(),
  current_period_end     timestamptz not null default (now() + interval '1 month'),
  polar_customer_id      text unique,
  polar_subscription_id  text unique,
  polar_product_id       text,
  polar_status           text not null default 'active'
                         check (polar_status in (
                           'active', 'past_due', 'canceled',
                           'unpaid', 'trialing', 'paused'
                         )),
  cancel_at_period_end   boolean not null default false,
  trial_end              timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_polar_customer_idx on public.subscriptions (polar_customer_id);
create index subscriptions_polar_sub_idx on public.subscriptions (polar_subscription_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.sync_subscription_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_profiles
    set subscription_tier = new.tier,
        updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

create trigger subscriptions_sync_tier
  after insert or update of tier on public.subscriptions
  for each row execute function public.sync_subscription_tier();

alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
grant select on public.subscriptions to authenticated;

create table public.credit_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  amount          integer not null,
  credit_type     text not null default 'monthly' check (credit_type in ('monthly', 'rollover', 'topup')),
  operation       text not null
                  check (operation in (
                    'monthly_grant', 'rollover', 'speed_search',
                    'quality_search', 'deep_research', 'topup_purchase',
                    'topup_expiry', 'promo', 'refund'
                  )),
  polar_order_id  text,
  chat_id         text references public.chats(id) on delete set null,
  message_id      text references public.messages(id) on delete set null,
  description     text,
  expires_at      timestamptz,
  balance_after   integer not null,
  created_at      timestamptz not null default now()
);

create index credit_ledger_user_created_idx on public.credit_ledger (user_id, created_at desc);
create index credit_ledger_operation_idx on public.credit_ledger (operation, created_at desc);
create index credit_ledger_topup_expiry_idx on public.credit_ledger (expires_at)
  where credit_type = 'topup' and expires_at is not null;

alter table public.credit_ledger enable row level security;
create policy "credit_ledger_select_own" on public.credit_ledger
  for select using (auth.uid() = user_id);
grant select on public.credit_ledger to authenticated;

create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_operation text,
  p_chat_id text default null,
  p_message_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub subscriptions%rowtype;
  v_from_topup integer := 0;
  v_from_rollover integer := 0;
  v_from_monthly integer := 0;
  v_new_balance integer;
begin
  select * into v_sub
    from public.subscriptions
   where user_id = p_user_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_subscription');
  end if;

  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  if (v_sub.topup_credits + v_sub.rollover_credits + v_sub.credits_balance) < p_amount then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits',
      'balance', v_sub.topup_credits + v_sub.rollover_credits + v_sub.credits_balance
    );
  end if;

  v_from_topup := least(v_sub.topup_credits, p_amount);
  v_from_rollover := least(v_sub.rollover_credits, p_amount - v_from_topup);
  v_from_monthly := p_amount - v_from_topup - v_from_rollover;

  update public.subscriptions
     set topup_credits = topup_credits - v_from_topup,
         rollover_credits = rollover_credits - v_from_rollover,
         credits_balance = credits_balance - v_from_monthly,
         updated_at = now()
   where user_id = p_user_id;

  v_new_balance := (v_sub.topup_credits - v_from_topup)
                 + (v_sub.rollover_credits - v_from_rollover)
                 + (v_sub.credits_balance - v_from_monthly);

  insert into public.credit_ledger (
    user_id, amount, credit_type, operation, chat_id, message_id, balance_after
  ) values (
    p_user_id,
    -p_amount,
    case
      when v_from_topup > 0 then 'topup'
      when v_from_rollover > 0 then 'rollover'
      else 'monthly'
    end,
    p_operation,
    p_chat_id,
    p_message_id,
    v_new_balance
  );

  return jsonb_build_object('ok', true, 'balance_after', v_new_balance);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (
    user_id, tier, monthly_credits, credits_balance, current_period_start, current_period_end
  ) values (
    new.id, 'free', 20, 20, now(), now() + interval '1 month'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.user_profiles (id, full_name, avatar_url)
select id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

insert into public.subscriptions (
  user_id, tier, monthly_credits, credits_balance, current_period_start, current_period_end
)
select id, 'free', 20, 20, now(), now() + interval '1 month'
from auth.users
on conflict (user_id) do nothing;

-- ------------------------------------------------------------
-- Service role grants for server-side operations, webhooks, and cron jobs
-- ------------------------------------------------------------
grant usage on schema public to service_role;
grant select, insert, update, delete on public.swiss_cantons to service_role;
grant select, insert, update, delete on public.user_profiles to service_role;
grant select, insert, update, delete on public.chats to service_role;
grant select, insert, update, delete on public.messages to service_role;
grant select, insert, update, delete on public.parts to service_role;
grant select, insert, update, delete on public.feedback to service_role;
grant select, insert, update, delete on public.tax_topics to service_role;
grant select, insert, update, delete on public.chat_tax_topics to service_role;
grant select, insert, update, delete on public.official_sources to service_role;
grant select, insert, update, delete on public.source_tax_topics to service_role;
grant select, insert, update, delete on public.collections to service_role;
grant select, insert, update, delete on public.bookmarks to service_role;
grant select, insert, update, delete on public.tax_search_events to service_role;
grant select, insert, update, delete on public.trending_tax_queries to service_role;
grant select, insert, update, delete on public.tax_alert_subscriptions to service_role;
grant select, insert, update, delete on public.subscriptions to service_role;
grant select, insert, update, delete on public.credit_ledger to service_role;

grant execute on function public.deduct_credits(uuid, integer, text, text, text) to service_role;