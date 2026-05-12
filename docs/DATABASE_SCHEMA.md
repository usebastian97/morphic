# Database Schema

SwissTaxSearch uses Supabase PostgreSQL with Row-Level Security enabled on every app table. The current database baseline is the destructive reset migration at `supabase/migrations/001_swisstaxsearch_schema.sql`; previous product migrations were removed.

## Baseline Migration

`001_swisstaxsearch_schema.sql` drops the previous app-owned tables and functions, then creates the current Swiss tax schema:

- Core chat storage: `chats`, `messages`, `parts`, `feedback`
- Swiss tax profile data: `swiss_cantons`, `user_profiles`
- Tax taxonomy: `tax_topics`, `chat_tax_topics`
- Official-source catalogue: `official_sources`, `source_tax_topics`
- Saved work: `collections`, `bookmarks`
- Analytics and alerts: `tax_search_events`, `trending_tax_queries`, `tax_alert_subscriptions`
- Billing: `subscriptions`, `credit_ledger`, `deduct_credits()`

Seed data lives in:

- `supabase/seed/swiss_cantons.sql`
- `supabase/seed/tax_topics.sql`
- `supabase/seed/official_sources.sql`

## User Profiles

`user_profiles` stores only user identity and Swiss tax context:

| Column                                     | Purpose                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| `id`                                       | Supabase auth user id, primary key                                           |
| `full_name`, `avatar_url`, `bio`           | Account display and optional research focus                                  |
| `canton_code`                              | FK to `swiss_cantons(code)`                                                  |
| `municipality`                             | Optional municipality for local applicability                                |
| `taxpayer_type`                            | `individual`, `self_employed`, `business`, `expat`, `advisor`, `institution` |
| `preferred_language`                       | `de`, `fr`, `it`, `en`                                                       |
| `subscription_tier`                        | Denormalized from `subscriptions.tier`                                       |
| `onboarding_completed`                     | Middleware gate for authenticated users                                      |
| `last_seen_at`, `created_at`, `updated_at` | Activity and audit timestamps                                                |

The `handle_new_user()` trigger creates both `user_profiles` and `subscriptions` rows for new Supabase users.

## Official Sources

`official_sources` is the source-of-truth for domains that SwissTaxSearch is allowed to use. Search and fetch are official-only.

| Column                               | Purpose                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `slug`, `name`, `base_url`, `domain` | Source identity and domain policy                                                            |
| `jurisdiction_level`                 | `federal`, `canton`, `municipality`                                                          |
| `canton_code`, `municipality`        | Local applicability                                                                          |
| `source_type`                        | `tax_authority`, `official_portal`, `legal_database`, `official_news`, `statistics`, `forms` |
| `languages`                          | Available official languages                                                                 |
| `trust_score`                        | 0-100 score used by evidence scoring                                                         |
| `is_active`, `is_featured`           | Search catalogue controls                                                                    |

`source_tax_topics` maps official sources to `tax_topics` coverage.

## Tax Topics

`tax_topics` replaces the previous domain taxonomy. Seeded topics include income tax, wealth tax, corporate tax, VAT/MWST/TVA/IVA, withholding tax, deductions, property tax, inheritance and gift tax, deadlines/forms, double taxation, and official tax news.

`chat_tax_topics` links chats to topics with optional confidence scores.

## Search Analytics And Alerts

`tax_search_events` logs append-only search events with Swiss tax context: query, topic IDs, providers, result count, canton, municipality, taxpayer type, platform, and engagement flag.

`trending_tax_queries` stores precomputed daily, weekly, or monthly query aggregates by topic and canton.

`tax_alert_subscriptions` stores user-configured official tax alerts. Runtime notification delivery is still roadmap work.

## Subscriptions And Credits

`subscriptions` holds the active plan and credit balances:

- `tier`: `free`, `pro`, `plus`, `max`
- `monthly_credits`, `credits_balance`, `rollover_credits`, `topup_credits`
- `current_period_start`, `current_period_end`
- Polar IDs and status fields

`credit_ledger` is append-only. Negative entries represent search usage; positive entries represent monthly grants, rollover, top-ups, promos, or refunds.

`deduct_credits(p_user_id, p_amount, p_operation, p_chat_id, p_message_id)` spends credits in this order: top-up, rollover, monthly. It inserts a ledger entry and returns JSON with `ok` and `balance_after`.

## Message Metadata

`messages.metadata` can include:

```jsonc
{
  "traceId": "string",
  "searchMode": "quick | adaptive",
  "modelId": "provider:model",
  "evidence_score": {
    "overall": 78,
    "label": "High",
    "computed_at": "2026-05-12T12:00:00.000Z",
    "breakdown": {
      "federal_count": 2,
      "cantonal_count": 3,
      "municipal_count": 0,
      "legal_or_form_count": 2,
      "official_news_count": 1,
      "non_official_count": 0,
      "total_sources": 5,
      "avg_official_trust": 92,
      "used_non_official_results": false,
      "primary_source_type": "mixed_official"
    }
  }
}
```

Evidence scores are computed after assistant messages are saved and are returned by `GET /api/messages/[messageId]/evidence-score`.
