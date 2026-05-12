# Configuration Guide

This project is configured as SwissTaxSearch, a real-time official Swiss tax search app.

## Required Environment Variables

```bash
DEEPSEEK_API_KEY=
PARALLEL_API_KEY=
DATABASE_URL=
```

`DEEPSEEK_API_KEY` powers the default models and query enrichment. `PARALLEL_API_KEY` powers official-source search. `DATABASE_URL` is required for migrations and persisted chat/history features.

## Supabase Auth

For multi-user deployments:

```bash
ENABLE_AUTH=true
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is required for server-side evidence scoring and credit deduction paths that write through service-role operations.

Anonymous local mode is still supported for personal Docker deployments:

```bash
ENABLE_AUTH=false
ANONYMOUS_USER_ID=anonymous-user
```

Do not use anonymous mode for multi-user or production deployments.

## Search

SwissTaxSearch always uses Parallel Search for the active AI search tool:

```bash
PARALLEL_API_KEY=
```

The legacy `type="general"` and `type="optimized"` tool inputs remain for compatibility, but both route through `lib/tools/swiss-tax-search.ts`.

Search is official-only. Domains come from `official_sources` plus static Swiss federal/cantonal fallback domains in `lib/swiss-tax/official-domain-policy.ts`.

SearXNG, Tavily, Exa, Firecrawl, Brave, and Jina helpers remain in the repository for upstream Morphic compatibility and non-active utility code, but they are not the SwissTaxSearch AI tool path.

## Models

Speed mode uses DeepSeek V4 Flash. Quality mode uses DeepSeek V4 Pro. Cloud deployments read `config/models/cloud.json`.

## Credits

Authenticated chat requests are credit-gated:

- Speed mode: 1 credit
- Quality mode: 4 credits

Credit preflight is handled in `app/api/chat/route.ts` by `createCreditLimitResponse()`. Deduction runs after a successful response save through `deductCreditsAfterSuccess()`.

## Evidence Scoring

Evidence scoring is automatic when `SUPABASE_SERVICE_ROLE_KEY` is configured. It reads `official_sources`, computes official-source coverage, and stores the result in `messages.metadata.evidence_score`.

## Guest Mode

```bash
ENABLE_GUEST_CHAT=true
GUEST_CHAT_DAILY_LIMIT=10
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Guest mode uses ephemeral chats and does not deduct subscription credits.

## Mock Chat Mode

```bash
ENABLE_MOCK_CHAT=true
```

Mock mode returns Swiss tax themed streaming responses without calling AI/search APIs or writing to the database. Never enable it in production.

## File Upload

```bash
R2_ACCOUNT_ID=
S3_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=user-uploads
R2_PUBLIC_URL=
```

If these variables are missing, uploads are disabled.
