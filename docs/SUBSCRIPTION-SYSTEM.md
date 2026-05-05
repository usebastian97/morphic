# AgriEvidence — Subscription & Credits System Analysis

> Last updated: May 2026  
> Status: Design proposal — pending review  
> Billing provider: **Polar SDK**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Cost Model & Pricing Rationale](#2-cost-model--pricing-rationale)
3. [Credit System Design](#3-credit-system-design)
4. [Credit Top-Up Packs](#4-credit-top-up-packs)
5. [Plans & Feature Matrix](#5-plans--feature-matrix)
6. [Plan Details](#6-plan-details)
7. [Database — Extend or Create New Table?](#7-database--extend-or-create-new-table)
8. [Recommended Schema Changes](#8-recommended-schema-changes)
9. [Polar SDK Integration](#9-polar-sdk-integration)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Executive Summary

The current schema stores a single `subscription_tier` text column and two integer counters (`searches_this_month`, `monthly_search_limit`) directly on `user_profiles`. This works for a simple monthly cap but cannot support:

- Separate credit pools per search mode (Speed vs Quality)
- Credit top-up packs purchasable by paid users
- Credit rollover between billing periods
- Audit trails for billing disputes
- Polar webhook–driven tier changes
- Future add-ons (Deep Research reports, alert channels)

This document proposes a **credit-based system** with a new dedicated `subscriptions` table and a `credit_ledger` append-only log, while keeping `user_profiles.subscription_tier` as a denormalised fast-read column. Billing is handled entirely through **Polar SDK** — no Stripe dependency.

---

## 2. Cost Model & Pricing Rationale

### Estimated cost per operation (USD)

| Operation | Model / Provider | Est. cost |
|-----------|-----------------|-----------|
| Speed search (1 sub-query + ~5 tool steps) | DeepSeek V4 Flash + Parallel Search | ~$0.008 |
| Quality search (2 sub-queries + ~10 tool steps + reasoning) | DeepSeek V4 Pro + Parallel Search | ~$0.035 |
| Deep Research report (Parallel Deep Research) | Parallel API + DeepSeek Pro | ~$0.080 |
| Alert notification (email) | Resend | ~$0.001 |

> Estimates based on DeepSeek V4 public pricing (May 2026), Parallel Search standard tier, and typical token counts per AgriEvidence query. Actual costs vary with query complexity and Cloudflare KV cache hit rate.

### Target gross margin per plan

| Plan | Target margin | Rationale |
|------|--------------|-----------|
| Free | — (loss leader) | Acquisition, grant KPI reporting |
| Pro | 55–65% | Core paying user, price-sensitive segment |
| Plus | 65–72% | Power users, agronomists, researchers |
| Max | 70–75% | Institutions, extension services, policy makers |

### Credit value

**1 credit = $0.01 USD** (internal unit of account, not exposed to users directly as a dollar figure)

| Operation | Credits consumed | Rationale |
|-----------|-----------------|-----------|
| 1 Speed search | 1 credit | $0.008 cost → 1 credit at $0.01 gives healthy margin |
| 1 Quality search | 4 credits | $0.035 cost → 4 credits keeps ratio consistent |
| 1 Deep Research report | 10 credits | $0.080 cost → 10 credits, premium operation |
| 1 alert notification | 0 credits | Included in plan, negligible unit cost |

This unified model means users see one balance instead of separate Speed / Quality counters, and adding new billable operations in future requires no schema changes — only a new `operation` enum value in `credit_ledger`.

---

## 3. Credit System Design

### Monthly credit allocations per plan

| Plan | Monthly credits | Speed searches equiv. | Quality searches equiv. | Deep Research equiv. |
|------|-----------------|-----------------------|------------------------|----------------------|
| Free | 20 | 20 | 5 | — (not available) |
| Pro | 150 | 150 | 37 | — (not available) |
| Plus | 500 | 500 | 125 | 50 |
| Max | 2,000 | 2,000 | 500 | 200 |

> "Equiv." = how many pure searches of that type the budget covers if used exclusively for that mode.

### Credit rules

- Credits reset on the **UTC billing anniversary** (same day each month as the Polar subscription start date), not on the 1st of the month.
- **No rollover** for Free and Pro plans. Plus and Max plans roll over up to **20% of unused credits** at period end (capped at 100 for Plus, 400 for Max).
- Credits are deducted **after** a successful response is streamed and saved — never upfront. If a request fails mid-stream, no credits are consumed.
- **Top-up credits** purchased via packs (see Section 4) are kept in a separate `topup_credits` balance and spent first before monthly credits. They do not expire for 12 months from the purchase date.
- When a user reaches 0 credits (both monthly and top-up balances), a soft paywall is shown after the current in-flight response completes. They are not hard-blocked mid-stream.
- Free users cannot purchase top-up packs — they must upgrade to a paid plan first.

### Credit deduction order

```
1. topup_credits    (spent first — no expiry within 12 months, rewards investment)
2. rollover_credits (carried from previous period)
3. credits_balance  (current period monthly allocation)
```

---

## 4. Credit Top-Up Packs

Paid plan users (Pro, Plus, Max) can purchase additional credit packs at any time without changing their subscription tier. Packs are one-time purchases processed through **Polar** as products (not subscriptions).

### Pack pricing

| Pack | Credits | Price | Cost per credit (user) | Effective margin |
|------|---------|-------|------------------------|-----------------|
| Starter Pack | 50 credits | $3.00 | $0.060 | ~40% |
| Growth Pack | 150 credits | $7.00 | $0.047 | ~53% |
| Power Pack | 400 credits | $15.00 | $0.038 | ~62% |
| Research Pack | 1,000 credits | $30.00 | $0.030 | ~70% |

> Pack margins are intentionally lower than subscription margins — packs are a convenience product, not the primary revenue driver. The Research Pack at $0.030/credit is close to cost for Max-tier heavy users but builds loyalty and reduces churn at renewal.

### Pack rules

- Available to **Pro, Plus, and Max** subscribers only. Free users see the store but the buy buttons are disabled with an upgrade prompt.
- Top-up credits expire **12 months** from the purchase date, tracked per-ledger-entry via `expires_at`.
- No limit on how many packs a user can purchase; however, the combined top-up balance is capped at **5,000 credits** at any one time to prevent abuse.
- Top-up credits are non-refundable after purchase (standard Polar one-time product policy).
- Partial-use packs are not supported — credits are added to the balance atomically on `order.created`.

### Polar product configuration for packs

Each pack is a separate **Polar one-time product** (not a subscription). The webhook event `order.created` fires on successful purchase and triggers a credit ledger entry.

```
Polar product IDs (created in Polar dashboard):
  POLAR_PRODUCT_ID_PACK_STARTER    → 50 credits   / $3.00
  POLAR_PRODUCT_ID_PACK_GROWTH     → 150 credits  / $7.00
  POLAR_PRODUCT_ID_PACK_POWER      → 400 credits  / $15.00
  POLAR_PRODUCT_ID_PACK_RESEARCH   → 1,000 credits / $30.00
```

---

## 5. Plans & Feature Matrix

| Feature | Free | Pro ($9/mo) | Plus ($29/mo) | Max ($79/mo) |
|---------|:----:|:-----------:|:-------------:|:------------:|
| **Monthly credits** | 20 | 150 | 500 | 2,000 |
| Speed searches (credits × 1) | 20 | 150 | 500 | 2,000 |
| Quality searches (credits × 4) | 5 | 37 | 125 | 500 |
| Deep Research (credits × 10) | ❌ | ❌ | 50 | 200 |
| **Credit top-up packs** | ❌ | ✅ | ✅ | ✅ |
| Credit rollover (up to) | ❌ | ❌ | 100 credits | 400 credits |
| **Search features** | | | | |
| Trusted source prioritization | ✅ | ✅ | ✅ | ✅ |
| Evidence Score badge | ✅ | ✅ | ✅ | ✅ |
| Agricultural query enrichment | ✅ | ✅ | ✅ | ✅ |
| Season indicator | ✅ | ✅ | ✅ | ✅ |
| Quality mode (DeepSeek V4 Pro) | ❌ | ✅ | ✅ | ✅ |
| Deep Research mode (Parallel) | ❌ | ❌ | ✅ | ✅ |
| **Sharing** | | | | |
| Public chat sharing | ❌ | ✅ | ✅ | ✅ |
| OG preview on shared links | ❌ | ✅ | ✅ | ✅ |
| **History & organisation** | | | | |
| Chat history | 7 days | 90 days | 1 year | Unlimited |
| Bookmarks & collections | ❌ | ✅ | ✅ | ✅ |
| **Alerts** | | | | |
| Alert subscriptions | ❌ | 3 alerts | 15 alerts | Unlimited |
| Alert channels | — | Email only | Email + Push | Email + Push + Webhook |
| Parallel Monitor alerts (real-time) | ❌ | ❌ | ✅ | ✅ |
| **Profile & personalization** | | | | |
| Agricultural profile & onboarding | ✅ | ✅ | ✅ | ✅ |
| Multilingual responses (7 langs) | ✅ | ✅ | ✅ | ✅ |
| Copernicus weather context | ❌ | ❌ | ✅ | ✅ |
| **Extension worker features** | | | | |
| Farmer client management | ❌ | ❌ | ❌ | ✅ |
| Per-client chat context | ❌ | ❌ | ❌ | ✅ |
| **Support** | | | | |
| Support channel | Community | Email | Priority email | Dedicated Slack |
| SLA | None | None | 48h | 24h |
| **Billing** | | | | |
| Annual discount | — | 2 months free | 2 months free | 2 months free |
| Annual price | — | $90/yr | $290/yr | $790/yr |

---

## 6. Plan Details

### Free — $0/month

**Target user:** Smallholder farmer, student, first-time visitor, grant demo participant.

Free tier is the grant KPI driver. Every active free user counts toward "countries reached" and "queries resolved" metrics on the `/impact` dashboard. The 20-credit monthly limit is intentionally low enough to encourage upgrade but high enough to demonstrate real value in one session.

Key cost-control restrictions:
- No Quality mode — DeepSeek V4 Pro is ~4× more expensive than Flash.
- No Deep Research — Parallel Deep Research API has the highest per-query cost.
- 7-day chat history — reduces Supabase storage costs at scale.
- No top-up packs — free users must upgrade before accessing the credit store.

---

### Pro — $9/month ($90/year)

**Target user:** Commercial farmer, agronomist, extension agent on a budget.

At $9/month with 150 credits, the implied cost-per-credit to the user is $0.060 — a 6× margin over the $0.010 internal credit cost. At the expected 55–65% gross margin target this is comfortable accounting for infrastructure overhead (Supabase, Vercel, Cloudflare KV, Polar platform fees).

The primary upgrade driver from Free is **Quality mode**. Users who ask complex multi-factor agronomic questions — e.g. "optimal fertilizer schedule for maize in semi-arid climate given current soil moisture deficit" — need DeepSeek V4 Pro's extended reasoning. The difference in answer quality is immediately tangible.

Secondary drivers: 90-day history, public sharing, bookmarks, and access to the top-up credit store for heavier months. A user who hits their 150-credit monthly limit can immediately buy a Starter Pack ($3) to continue without waiting for the period to reset.

---

### Plus — $29/month ($290/year)

**Target user:** Agricultural researcher, agronomist with multiple clients, NGO field coordinator, EU grant applicant.

At $29/month with 500 credits, implied cost-per-credit to the user is $0.058. Plus is where AgriEvidence becomes a serious professional research tool:

- **Deep Research mode** (Parallel Deep Research) produces multi-page structured reports with primary source citations, methodology notes, and confidence levels — directly usable in grant applications and policy briefs.
- **Copernicus weather context** injects real-time ERA5 climate data into every query response, a requirement for EU Horizon Agri-food grant eligibility.
- **15 alert subscriptions** with real-time Parallel Monitor integration delivers proactive pest, disease, and regulation notifications without manual polling.
- **Credit rollover** (up to 100 credits) reduces churn during lighter months.

The 500-credit monthly allocation covers 125 Quality searches or 50 Deep Research reports — sufficient for intensive research sprints without requiring top-ups in typical months. The Growth Pack ($7 / 150 credits) is available for particularly busy periods.

---

### Max — $79/month ($790/year)

**Target user:** Research institution, agricultural university, large-scale extension service, government agency, policy maker.

At $79/month with 2,000 credits, implied cost-per-credit to the user is $0.040 — tightest subscription margin, but highest absolute revenue per seat. Infrastructure efficiency (Cloudflare KV cache hit rate > 40%) is assumed.

Unique capabilities at Max:
- **Extension Worker mode** — manage farmer client profiles, run queries in the context of a specific farmer's location and crops, maintain per-farmer chat history. This feature alone justifies the price for any extension worker serving 10+ clients.
- **Unlimited alert subscriptions** with webhook delivery — enables direct integrations with farm management systems and external dashboards.
- **400-credit rollover** makes Max viable for institutions where usage peaks around planting seasons and is quiet otherwise.
- The **Research Pack** ($30 / 1,000 credits) gives Max users the best per-credit price ($0.030) for supplemental credits during intensive periods — effectively the same rate as a second Max subscription but without the tier commitment.

---

## 7. Database — Extend or Create New Table?

### Current state

Subscription data lives in two columns on `user_profiles`:

```sql
subscription_tier    text    NOT NULL DEFAULT 'free'
searches_this_month  integer NOT NULL DEFAULT 0
monthly_search_limit integer NOT NULL DEFAULT 20
```

### Option A — Extend `user_profiles` (NOT recommended)

**Problems:**
- `user_profiles` already mixes agricultural context (farm type, crops, climate zone) with billing state. Adding ~10 more billing columns creates a god table that is hard to reason about, cache, and secure.
- No audit trail — a single UPDATE overwrites the previous balance with no history. Billing disputes become impossible to resolve.
- Top-up packs require a `topup_credits` column, rollover requires another, expiry tracking requires yet another. Schema complexity grows with every new billing feature.
- Polar webhooks must write to a row protected by user-only RLS — requires service role on every billing event that touches user profile data, blurring the security boundary.
- Analytics queries (MRR, churn, credit consumption by operation type, top-up revenue) require full table scans on the largest and most frequently written table in the DB.

### Option B — New `subscriptions` + `credit_ledger` tables (RECOMMENDED)

- `user_profiles` keeps only `subscription_tier` (denormalised for fast reads in `app/api/chat/route.ts`)
- `subscriptions` owns all billing state: Polar IDs, period dates, all credit balances
- `credit_ledger` is an append-only log of every credit movement including top-up purchases, monthly grants, rollover, and deductions

**Key advantages:**
- Full audit trail for every credit movement — essential for support and billing disputes.
- Polar webhooks write only to `subscriptions` and `credit_ledger` via service role, never touching user agricultural profile data.
- Credit balance is always derivable from the ledger — the `credits_balance` column in `subscriptions` is a denormalised cache updated atomically by a Postgres function that also writes the ledger entry in the same transaction.
- Rollover is computed cleanly at period end from the ledger without destructive in-row arithmetic.
- Top-up pack credits tracked per-entry with individual `expires_at` — the 12-month expiry rule is enforced without a separate table.
- Analytics queries (operation breakdown, top-up revenue vs subscription revenue, credits per search mode) are indexed and trivial.

**The only cost** is one additional JOIN when reading the credit balance at request time. Given the profile is already fetched once per request and `subscriptions` has a unique index on `user_id`, this adds < 2ms per request.

**Verdict: Create new tables. Do not extend `user_profiles` further.**

---

## 8. Recommended Schema Changes

### 8.1 Modify `user_profiles`

Remove the old counter columns and update the tier CHECK constraint to cover the four new tiers:

```sql
-- supabase/migrations/014_user_profiles_billing.sql

ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS searches_this_month,
  DROP COLUMN IF EXISTS monthly_search_limit;

-- Remap any legacy 'enterprise' rows before adding constraint
UPDATE user_profiles
  SET subscription_tier = 'max'
WHERE subscription_tier = 'enterprise';

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_tier_check,
  ADD CONSTRAINT user_profiles_tier_check
    CHECK (subscription_tier IN ('free', 'pro', 'plus', 'max'));
```

---

### 8.2 New table: `subscriptions`

```sql
-- supabase/migrations/012_subscriptions.sql

CREATE TABLE subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tier
  tier                   text NOT NULL DEFAULT 'free'
                           CHECK (tier IN ('free', 'pro', 'plus', 'max')),

  -- Monthly credit budget
  monthly_credits        integer NOT NULL DEFAULT 20,   -- cap for current period
  credits_balance        integer NOT NULL DEFAULT 20,   -- spendable monthly credits remaining
  rollover_credits       integer NOT NULL DEFAULT 0,    -- carried from previous period

  -- Top-up credits (purchased packs, spent before monthly credits)
  topup_credits          integer NOT NULL DEFAULT 0,    -- total unexpired top-up balance

  -- Billing period
  current_period_start   timestamptz NOT NULL DEFAULT now(),
  current_period_end     timestamptz NOT NULL DEFAULT (now() + interval '1 month'),

  -- Polar IDs
  polar_customer_id      text UNIQUE,
  polar_subscription_id  text UNIQUE,
  polar_product_id       text,                          -- current plan product ID in Polar
  polar_status           text NOT NULL DEFAULT 'active'
                           CHECK (polar_status IN (
                             'active', 'past_due', 'canceled',
                             'unpaid', 'trialing', 'paused'
                           )),

  -- Metadata
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  trial_end              timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- One active subscription per user
CREATE UNIQUE INDEX subscriptions_user_idx ON subscriptions (user_id);

-- Fast Polar webhook lookups
CREATE INDEX subscriptions_polar_customer_idx ON subscriptions (polar_customer_id);
CREATE INDEX subscriptions_polar_sub_idx      ON subscriptions (polar_subscription_id);

-- Auto-update updated_at
CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sync subscription_tier back to user_profiles on tier change
CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE user_profiles
    SET subscription_tier = NEW.tier,
        updated_at        = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_sync_tier
  AFTER INSERT OR UPDATE OF tier ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_tier();

-- RLS: users can read own subscription; all writes are service-role only
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON subscriptions TO authenticated;
```

---

### 8.3 New table: `credit_ledger`

```sql
-- supabase/migrations/013_credit_ledger.sql

CREATE TABLE credit_ledger (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Amount: positive = credits added, negative = credits spent
  amount         integer NOT NULL,

  -- Which pool this entry draws from or adds to
  credit_type    text NOT NULL DEFAULT 'monthly'
                   CHECK (credit_type IN ('monthly', 'rollover', 'topup')),

  -- Operation type
  operation      text NOT NULL
                   CHECK (operation IN (
                     'monthly_grant',    -- +N  period reset grant
                     'rollover',         -- +N  carry-over from previous period
                     'speed_search',     -- -1  Speed mode query
                     'quality_search',   -- -4  Quality mode query
                     'deep_research',    -- -10 Deep Research report
                     'topup_purchase',   -- +N  one-time credit pack purchase via Polar
                     'topup_expiry',     -- -N  expired top-up credits removed by cron
                     'promo',            -- +N  promotional grant
                     'refund'            -- +N  reversal of a previous deduction
                   )),

  -- Polar order reference for top-up purchases (traceability)
  polar_order_id text,

  -- Context for search deductions
  chat_id        text REFERENCES chats(id) ON DELETE SET NULL,
  message_id     text REFERENCES messages(id) ON DELETE SET NULL,

  -- Human-readable note
  description    text,

  -- Expiry: only populated for topup credit entries
  expires_at     timestamptz,

  -- Denormalised balance snapshot after this transaction (for fast display in UI)
  balance_after  integer NOT NULL,

  created_at     timestamptz NOT NULL DEFAULT now()
);

-- "All transactions for user X, newest first"
CREATE INDEX credit_ledger_user_created_idx
  ON credit_ledger (user_id, created_at DESC);

-- Analytics: "all quality_search debits in a given month"
CREATE INDEX credit_ledger_operation_idx
  ON credit_ledger (operation, created_at DESC);

-- Top-up expiry cron: "find unexpired topup entries older than 12 months"
CREATE INDEX credit_ledger_topup_expiry_idx
  ON credit_ledger (expires_at)
  WHERE credit_type = 'topup' AND expires_at IS NOT NULL;

-- Append-only enforced by RLS (no UPDATE / DELETE policies defined)
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_ledger_select_own ON credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY credit_ledger_insert_service ON credit_ledger
  FOR INSERT WITH CHECK (true);  -- service role only in practice

GRANT SELECT ON credit_ledger TO authenticated;
```

---

### 8.4 Postgres function: atomic credit deduction

To prevent race conditions when two concurrent requests attempt to deduct credits simultaneously, deduction is handled by a single Postgres function called via Supabase RPC:

```sql
-- Included at the end of 013_credit_ledger.sql

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id    uuid,
  p_amount     integer,
  p_operation  text,
  p_chat_id    text    DEFAULT NULL,
  p_message_id text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub            subscriptions%ROWTYPE;
  v_from_topup     integer := 0;
  v_from_rollover  integer := 0;
  v_from_monthly   integer := 0;
  v_new_balance    integer;
BEGIN
  -- Lock the subscription row to prevent concurrent deductions
  SELECT * INTO v_sub
    FROM subscriptions
   WHERE user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_subscription');
  END IF;

  -- Check total available balance across all pools
  IF (v_sub.topup_credits + v_sub.rollover_credits + v_sub.credits_balance) < p_amount THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits',
      'balance', v_sub.topup_credits + v_sub.rollover_credits + v_sub.credits_balance
    );
  END IF;

  -- Deduct from top-up first
  v_from_topup    := LEAST(v_sub.topup_credits, p_amount);

  -- Then from rollover
  v_from_rollover := LEAST(v_sub.rollover_credits, p_amount - v_from_topup);

  -- Then from monthly balance
  v_from_monthly  := p_amount - v_from_topup - v_from_rollover;

  -- Apply all deductions atomically
  UPDATE subscriptions
     SET topup_credits    = topup_credits    - v_from_topup,
         rollover_credits = rollover_credits - v_from_rollover,
         credits_balance  = credits_balance  - v_from_monthly,
         updated_at       = now()
   WHERE user_id = p_user_id;

  -- Compute new total balance for ledger snapshot
  v_new_balance := (v_sub.topup_credits    - v_from_topup)
                 + (v_sub.rollover_credits - v_from_rollover)
                 + (v_sub.credits_balance  - v_from_monthly);

  -- Write append-only ledger entry
  INSERT INTO credit_ledger (
    user_id, amount, credit_type, operation,
    chat_id, message_id, balance_after
  ) VALUES (
    p_user_id,
    -p_amount,
    CASE
      WHEN v_from_topup > 0    THEN 'topup'
      WHEN v_from_rollover > 0 THEN 'rollover'
      ELSE 'monthly'
    END,
    p_operation,
    p_chat_id,
    p_message_id,
    v_new_balance
  );

  RETURN jsonb_build_object('ok', true, 'balance_after', v_new_balance);
END;
$$;
```

---

### 8.5 Migration order update

```
001_extensions.sql             ✅ existing
002_core_tables.sql            ✅ existing
003_user_profiles.sql          ✅ existing
004_topics.sql                 ✅ existing
005_sources.sql                ✅ existing
006_bookmarks.sql              ✅ existing
007_analytics.sql              ✅ existing
008_alerts.sql                 ✅ existing
009_service_role_grants.sql    ✅ existing
010_farmer_clients.sql         🔲 Sprint 3.2
011_source_queue.sql           🔲 Parallel Phase C
012_subscriptions.sql          🔲 This proposal
013_credit_ledger.sql          🔲 This proposal  (includes deduct_credits RPC)
014_user_profiles_billing.sql  🔲 This proposal  (drop old columns, update CHECK)
```

---

## 9. Polar SDK Integration

### Why Polar

[Polar](https://polar.sh) is an open-source merchant of record for developers — it handles subscriptions, one-time purchases, EU VAT, and payouts with a developer-first SDK (`@polar-sh/nextjs`). It is the natural fit for AgriEvidence because:

- Native support for both **subscriptions** (monthly/annual plans) and **one-time products** (top-up packs) managed from the same dashboard.
- Webhook events cover all required cases: `subscription.created`, `subscription.updated`, `subscription.canceled`, and `order.created` (for pack purchases).
- No PCI scope — Polar is the merchant of record and handles payment processing.
- Generous free tier for open-source and grant-funded projects.
- Built-in customer portal for self-service plan management.

### SDK setup

```bash
bun add @polar-sh/nextjs
```

### Environment variables

```bash
# Polar core
POLAR_ACCESS_TOKEN=                   # Server-side API token (keep secret)
POLAR_WEBHOOK_SECRET=                 # Webhook signing secret
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=    # Public org ID for client-side checkout links

# Subscription product IDs (created in Polar dashboard)
POLAR_PRODUCT_ID_PRO_MONTHLY=
POLAR_PRODUCT_ID_PRO_ANNUAL=
POLAR_PRODUCT_ID_PLUS_MONTHLY=
POLAR_PRODUCT_ID_PLUS_ANNUAL=
POLAR_PRODUCT_ID_MAX_MONTHLY=
POLAR_PRODUCT_ID_MAX_ANNUAL=

# Top-up pack product IDs (one-time products in Polar dashboard)
POLAR_PRODUCT_ID_PACK_STARTER=        # 50 credits  / $3.00
POLAR_PRODUCT_ID_PACK_GROWTH=         # 150 credits / $7.00
POLAR_PRODUCT_ID_PACK_POWER=          # 400 credits / $15.00
POLAR_PRODUCT_ID_PACK_RESEARCH=       # 1,000 credits / $30.00
```

### Files to create

| File | Purpose |
|------|---------|
| `lib/billing/polar-client.ts` | Singleton `Polar` client initialised with `POLAR_ACCESS_TOKEN` |
| `lib/billing/polar-products.ts` | Typed map of product IDs → credit amounts, tier names, and pack sizes |
| `lib/billing/create-checkout.ts` | `createSubscriptionCheckout(userId, productId)` and `createTopupCheckout(userId, packProductId)` — returns Polar checkout URL |
| `app/api/webhooks/polar/route.ts` | POST endpoint — validates Polar HMAC signature, routes events to handlers |
| `app/api/billing/checkout/route.ts` | GET — creates checkout session and redirects user to Polar-hosted payment page |
| `app/api/billing/portal/route.ts` | GET — redirects to Polar customer portal for self-service plan management |

### Webhook event handling

```typescript
// app/api/webhooks/polar/route.ts

// Event: subscription.created
// → INSERT into subscriptions with tier, polar IDs, period dates, monthly_credits
// → INSERT 'monthly_grant' credit_ledger entry for the initial period
// → DB trigger syncs subscription_tier back to user_profiles automatically

// Event: subscription.updated  (upgrade / downgrade / renewal)
// → UPDATE subscriptions: tier, polar_product_id, period dates, monthly_credits
// → If period_start changed (renewal): INSERT 'monthly_grant' entry + optional 'rollover' entry
// → DB trigger syncs subscription_tier

// Event: subscription.canceled
// → UPDATE subscriptions: polar_status = 'canceled', cancel_at_period_end = true
// → Credits remain usable until current_period_end — do NOT zero the balance here

// Event: order.created  (top-up pack purchase)
// → Resolve pack size from metadata.product_id using polar-products.ts map
// → Verify user is on a paid plan (reject if tier = 'free')
// → Verify topup_credits + pack_size <= 5,000 (max balance guard)
// → UPDATE subscriptions.topup_credits += pack_size
// → INSERT 'topup_purchase' credit_ledger entry:
//     amount        = +pack_size
//     credit_type   = 'topup'
//     polar_order_id = event.data.id
//     expires_at    = now() + interval '12 months'
//     balance_after = new total balance
```

### Checkout flow

```
User clicks "Upgrade to Pro" or "Buy Growth Pack"
  → GET /api/billing/checkout?product=pro_monthly  (or pack_growth)
    → lib/billing/create-checkout.ts
      → polar.checkouts.create({
          productId: POLAR_PRODUCT_ID_PRO_MONTHLY,
          successUrl: '/billing?success=true',
          metadata: { userId }
        })
      → return { checkoutUrl }
    → 302 redirect to Polar hosted checkout page
  → Polar processes payment
  → Polar POSTs to /api/webhooks/polar
    → handler updates subscriptions + credit_ledger
  → User redirected to /billing?success=true
  → Billing page reads updated subscription via getSubscription()
```

---

## 10. Implementation Checklist

### Phase 1 — Schema (1–2 days)

- [ ] Write `012_subscriptions.sql` per spec in Section 8.2
- [ ] Write `013_credit_ledger.sql` per spec in Section 8.3 (includes `deduct_credits` RPC function)
- [ ] Write `014_user_profiles_billing.sql` — drop old columns, remap `enterprise` → `max`, update CHECK
- [ ] Seed one `subscriptions` row per existing user (free tier, 20 credits)
- [ ] Update `009_service_role_grants.sql` to add service role grants on `subscriptions` and `credit_ledger`

### Phase 2 — Credit logic (2–3 days)

- [ ] Create `lib/subscriptions/get-subscription.ts` — fetch active subscription for a user (60s in-memory TTL per request)
- [ ] Create `lib/subscriptions/deduct-credits.ts` — calls `deduct_credits` RPC, handles `insufficient_credits` error gracefully
- [ ] Create `lib/subscriptions/credit-costs.ts` — named constants: `CREDIT_COST_SPEED = 1`, `CREDIT_COST_QUALITY = 4`, `CREDIT_COST_DEEP_RESEARCH = 10`
- [ ] Create `lib/subscriptions/grant-monthly-credits.ts` — called by period-reset cron; computes rollover amount, inserts `monthly_grant` + optional `rollover` ledger entries, resets `credits_balance`
- [ ] Create `lib/subscriptions/expire-topup-credits.ts` — called by daily cron; finds expired topup ledger entries, deducts from `topup_credits`, inserts `topup_expiry` ledger entries
- [ ] Integrate deduction into `lib/streaming/helpers/persist-stream-results.ts` after successful stream save
- [ ] Update `app/api/chat/route.ts` — check credit balance before accepting request; return `402 { error: 'insufficient_credits', balance: N }` if total balance = 0

### Phase 3 — Polar integration (2–3 days)

- [ ] `bun add @polar-sh/nextjs`
- [ ] Create `lib/billing/polar-client.ts`
- [ ] Create `lib/billing/polar-products.ts` — full product ID → metadata map
- [ ] Create `lib/billing/create-checkout.ts` — subscription and top-up checkout helpers
- [ ] Create `app/api/webhooks/polar/route.ts` — handle `subscription.*` and `order.created` events per Section 9
- [ ] Create `app/api/billing/checkout/route.ts`
- [ ] Create `app/api/billing/portal/route.ts`
- [ ] Add all `POLAR_*` env vars to `.env.local.example` and document in `docs/CONFIGURATION.md`
- [ ] Period-reset cron: Supabase Edge Function or Vercel Cron (runs daily) — finds subscriptions where `current_period_end <= now()`, calls `grant-monthly-credits.ts`
- [ ] Top-up expiry cron: same job — calls `expire-topup-credits.ts` for entries where `expires_at <= now()`

### Phase 4 — UI (2–3 days)

- [ ] Create `app/(app)/billing/page.tsx` — sections: current plan summary, credit balance breakdown, usage history chart (last 30 days from `credit_ledger`), top-up pack store, upgrade/downgrade CTA
- [ ] Create `components/billing/credit-usage-bar.tsx` — stacked bar showing topup (green) / rollover (blue) / monthly (neutral) credit pools
- [ ] Create `components/billing/topup-pack-card.tsx` — card with pack name, credit amount, price, "Buy" button; disabled with upgrade prompt for free tier users
- [ ] Add combined credit balance indicator to sidebar and user menu (topup + rollover + monthly)
- [ ] Soft paywall modal when total balance = 0 — displayed after current in-flight response completes; includes upgrade CTA and direct links to top-up packs
- [ ] Update marketing pricing page with the four plans and feature matrix from Section 5

### Phase 5 — Rate limit migration (1 day)

- [ ] Remove `searches_this_month` / `monthly_search_limit` reads from `lib/rate-limit/chat-limits.ts`
- [ ] Remove `adaptive-limit.ts` Redis counter for Quality mode — now handled by credit cost × 4 via `deduct_credits`
- [ ] Update `optimize-parallel-search-requests.md` Optimization 4 — the per-user daily search counter should read `subscriptions.credits_balance + topup_credits + rollover_credits` instead of a separate Redis key

---

*AgriEvidence — Evidence-based agriculture for everyone.*