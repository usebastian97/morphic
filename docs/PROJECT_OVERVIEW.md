# Project Overview

SwissTaxSearch is a Morphic-based AI answer engine for real-time research across official Swiss tax websites. It searches federal, cantonal, and municipal sources, synthesizes the latest official tax information, and keeps jurisdiction applicability visible in every answer.

## Stack

- Next.js App Router, React 19, TypeScript, Bun
- Vercel AI SDK tool-loop streaming
- DeepSeek V4 Flash for Speed mode and query enrichment
- DeepSeek V4 Pro for Quality mode reasoning
- Parallel Search for official-source web retrieval
- Supabase Auth and PostgreSQL with RLS
- Tailwind CSS v4, shadcn/ui, Radix UI, Iconify Solar icons

## Domain Model

The app is now Swiss tax focused:

- User profile context: canton, municipality, taxpayer type, preferred language
- Topics: Swiss tax categories such as VAT, income tax, deductions, deadlines, forms, official tax news, and double taxation
- Sources: official federal, cantonal, and municipal domains only
- Evidence score: official-source coverage score, with federal/cantonal/municipal breakdowns

## Search Flow

1. `app/api/chat/route.ts` authenticates the user, selects Speed or Quality mode, preflights subscription credits, and loads the Swiss tax profile.
2. `lib/agents/researcher.ts` creates the Researcher agent with SwissTaxSearch instructions and profile context.
3. `lib/tools/search.ts` delegates to `lib/tools/swiss-tax-search.ts`.
4. `lib/swiss-tax/query-enricher.ts` expands the user query into Swiss tax search queries using federal, cantonal, multilingual, and topic-specific terms.
5. Parallel Search runs with an official-only `include_domains` policy built from `official_sources` and static Swiss government fallbacks.
6. Results are filtered again by `lib/swiss-tax/official-domain-policy.ts` before they reach the model.

Open-web fallback is disabled. If official coverage is thin, the assistant must say that clearly.

The legacy `/api/advanced-search` SearXNG route is also filtered through the official Swiss tax domain policy before returning or crawling results, so exposed search utilities cannot bypass the product-level official-source constraint.

## Fetch Flow

`lib/tools/fetch.ts` only fetches direct URLs that match the official Swiss tax/government domain policy. Non-official URLs are rejected with a clear error.

## Streaming And Persistence

Persistent authenticated chats use `lib/streaming/create-chat-stream-response.ts`. After a response is saved by `persistStreamResults()`:

- Credits are deducted through `deduct_credits()` using `lib/subscriptions/credits.ts`
- Evidence score is computed with `lib/swiss-tax/official-source-score.ts`
- The score is stored in `messages.metadata.evidence_score`

Guest chats remain ephemeral and use the existing guest rate limit.

## Profile And Onboarding

`app/(app)/onboarding/page.tsx` now collects:

- Taxpayer type
- Canton
- Municipality
- Optional research focus notes
- Preferred language

`components/profile/profile-form.tsx` lets users edit the same Swiss tax context later.

## Subscription Credits

Plan economics are unchanged from the prior design:

- Free: 20 credits/month
- Pro: 150 credits/month
- Plus: 500 credits/month
- Max: 2,000 credits/month

Runtime credit usage is now active for authenticated users:

- Speed search: 1 credit
- Quality search: 4 credits

Credits are preflighted before streaming and deducted only after a successful assistant response is saved.
