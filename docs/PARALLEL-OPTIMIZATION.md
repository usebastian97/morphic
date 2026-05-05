# Prompt: Optimize Parallel Search API Request Volume

## Context

AgriEvidence uses Parallel Search as its primary search backend. Every user message triggers:
1. A query enricher (`lib/agri/query-enricher.ts`) that expands the query into 2–3 sub-queries
2. A Researcher agent tool loop (`lib/agents/researcher.ts`) that iterates up to 20 steps, calling the `search` tool multiple times per message

This results in a high number of Parallel Search API calls per user message. The goal of this task is to reduce that volume without degrading answer quality.

---

## Task Overview

Implement the following five optimizations in order of priority. Each section specifies exact files, changes, and acceptance criteria.

---

## Optimization 1 — Cap Sub-queries by Search Mode

**File:** `lib/agri/query-enricher.ts`

**Change:** The enricher currently generates 2–3 sub-queries regardless of search mode. Introduce a `maxSubQueries` parameter that is passed in from `app/api/chat/route.ts` based on the active search mode.

- Speed mode (`quick`): `maxSubQueries = 1`
- Quality mode (`adaptive`): `maxSubQueries = 2`

**Implementation notes:**
- Update the enricher function signature to accept `searchMode: 'quick' | 'adaptive'` (or a `maxSubQueries: number` parameter — either is acceptable)
- Update the DeepSeek V4 Flash prompt to instruct the model to return exactly N sub-queries
- Update the call site in `app/api/chat/route.ts` to pass the search mode through

**Acceptance criteria:**
- Speed mode produces exactly 1 enriched sub-query
- Quality mode produces at most 2 enriched sub-queries
- Existing unit tests still pass; add tests for both modes

---

## Optimization 2 — Reduce `maxSteps` in Researcher Agent

**File:** `lib/agents/researcher.ts`

**Change:** The tool loop currently allows up to 20 steps in Speed mode. Reduce per-mode limits:

- Speed mode (`quick`): `maxSteps = 5`
- Quality mode (`adaptive`): `maxSteps = 10`

**Implementation notes:**
- Locate where `maxSteps` is configured in the `ToolLoopAgent` or Vercel AI SDK call
- Make the value conditional on the search mode that is already passed into the Researcher
- Do not change any other agent behavior

**Acceptance criteria:**
- A Speed mode request never makes more than 5 tool-loop iterations
- A Quality mode request never makes more than 10 tool-loop iterations

---

## Optimization 3 — Cloudflare KV Cache for Search Results

**Files:** Create `lib/tools/search-cache.ts` · Modify `lib/tools/agri-search.ts`

**Change:** Before calling Parallel Search, check Cloudflare KV for a cached result keyed by a hash of the query string. On a miss, call Parallel Search and write the result to KV with a 1-hour TTL.

**Cache key format:**
```
agri:search:{sha256(query.trim().toLowerCase())}
```

**Cloudflare KV setup:**

Create a KV namespace in the Cloudflare dashboard (or via Wrangler CLI):

```bash
wrangler kv:namespace create "SEARCH_CACHE"
wrangler kv:namespace create "SEARCH_CACHE" --preview
```

Bind the namespace in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SEARCH_CACHE"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_PREVIEW_NAMESPACE_ID"
```

For local development outside Workers (e.g. Next.js on Node), access KV via the **Cloudflare REST API** using an API token with KV write permissions.

**New environment variables:**

```bash
CLOUDFLARE_ACCOUNT_ID=          # Cloudflare account ID
CLOUDFLARE_KV_NAMESPACE_ID=     # KV namespace ID bound above
CLOUDFLARE_KV_API_TOKEN=        # API token with KV:Edit permission
SEARCH_CACHE_TTL_SECONDS=3600   # default 1 hour
```

**`lib/tools/search-cache.ts` — implementation outline:**

```typescript
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NS_ID}`;

export async function getCachedSearch(key: string): Promise<SearchResult[] | null> {
  const res = await fetch(`${BASE}/values/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (!res.ok) return null;           // miss or error → fall through
  return res.json();
}

export async function setCachedSearch(
  key: string,
  value: SearchResult[],
  ttlSeconds: number
): Promise<void> {
  await fetch(`${BASE}/values/${encodeURIComponent(key)}?expiration_ttl=${ttlSeconds}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(value)
  });
  // fire-and-forget — errors are swallowed intentionally
}
```

**Implementation notes:**
- Wrap both `getCachedSearch` and `setCachedSearch` in `try/catch` — any Cloudflare error must log to console and fall through to a live Parallel Search call; never throw
- If running inside a Cloudflare Worker, use the `env.SEARCH_CACHE` binding directly (no REST API needed); detect the runtime with `typeof caches !== 'undefined'` or an explicit `RUNTIME` env var
- Cache the full result array returned by Parallel Search
- `SEARCH_CACHE_TTL_SECONDS` controls expiration and defaults to `3600`

**Acceptance criteria:**
- Identical queries within the TTL window hit KV and skip Parallel Search
- A Cloudflare KV failure does not break search — it silently falls back to a live call
- The new env vars are documented in `docs/CONFIGURATION.md` under a new "Search Result Cache" subsection

---

## Optimization 4 — Per-User Daily Search Call Limit

**File:** `lib/rate-limit/chat-limits.ts` (or create `lib/rate-limit/search-limits.ts` if separation is cleaner)

**Change:** Add a Redis-backed counter that tracks the number of Parallel Search API calls made per authenticated user per UTC day. Enforce a configurable daily ceiling.

**New environment variable:**
```
PARALLEL_SEARCHES_DAILY_LIMIT=50
```

**Behavior:**
- Only enforce when `MORPHIC_CLOUD_DEPLOYMENT=true` (consistent with existing adaptive rate limit pattern)
- When the limit is reached, return a structured error from the search tool that the Researcher agent can surface to the user as a friendly message (e.g. *"You have reached your monthly search limit. Upgrade to Pro for more searches."*)
- Free tier: 20 searches/month (default)
- Pro tier: 100 searches/month
- Extension tier: 200 searches/month
- Read the user's `subscription_tier` from `user_profiles` to select the correct ceiling

**Redis key format:**
```
agri:search-limit:{userId}:{YYYY-MM-DD}
```

Set TTL to 25 hours to ensure the key expires after the UTC day rolls over.

**Acceptance criteria:**
- Free users are blocked after 50 Parallel Search calls in a single UTC day
- Pro / Extension users have higher ceilings as specified above
- Limit is not enforced when `MORPHIC_CLOUD_DEPLOYMENT` is not `true`
- The new env var is documented in `docs/CONFIGURATION.md`

---

## Optimization 5 — Sub-query Deduplication Before Search

**File:** `lib/agri/query-enricher.ts` (or a new `lib/agri/query-deduplicator.ts`)

**Change:** After the enricher generates sub-queries, filter out any that are too similar to each other before they are passed to the search tool. Use a simple normalized edit-distance (Levenshtein) or token-overlap ratio — no embeddings required.

**Algorithm:**
```
threshold = 0.75  // Jaccard similarity on unigram token sets

function deduplicate(queries: string[]): string[] {
  const kept: string[] = []
  for (const q of queries) {
    const tokens = new Set(q.toLowerCase().split(/\s+/))
    const isDuplicate = kept.some(k => {
      const kTokens = new Set(k.toLowerCase().split(/\s+/))
      const intersection = [...tokens].filter(t => kTokens.has(t)).length
      const union = new Set([...tokens, ...kTokens]).size
      return intersection / union >= threshold
    })
    if (!isDuplicate) kept.push(q)
  }
  return kept
}
```

**Implementation notes:**
- Apply deduplication after enrichment and before the queries are handed to the search tool
- Always keep at least 1 query even if all are above the similarity threshold
- The threshold should be a named constant so it can be adjusted easily

**Acceptance criteria:**
- Nearly-identical sub-queries are collapsed to one
- At least one sub-query is always returned
- Unit tests cover: all-unique input, all-identical input, partial overlap input

---

## Files to Create or Modify (Summary)

| File | Action | Optimization |
|------|--------|-------------|
| `lib/agri/query-enricher.ts` | Modify | 1, 5 |
| `lib/agents/researcher.ts` | Modify | 2 |
| `lib/tools/agri-search.ts` | Modify | 3 |
| `lib/tools/search-cache.ts` | Create | 3 |
| `lib/rate-limit/search-limits.ts` | Create | 4 |
| `app/api/chat/route.ts` | Modify | 1, 4 |
| `docs/CONFIGURATION.md` | Modify | 3, 4 |

---

## Environment Variables Added

```bash
# Search Result Cache — Cloudflare KV (Optimization 3)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_KV_NAMESPACE_ID=
CLOUDFLARE_KV_API_TOKEN=
SEARCH_CACHE_TTL_SECONDS=3600   # default 1 hour

# Per-User Search Limit (Optimization 4)
PARALLEL_SEARCHES_DAILY_LIMIT=50  # free tier default; enforced only in cloud mode
```

Add both to the existing `.env.local.example` file if one exists.

---

## Testing

For each optimization, add or update tests in the relevant `*.test.ts` file:

- `lib/agri/query-enricher.test.ts` — sub-query count per mode, deduplication cases
- `lib/tools/search-cache.test.ts` — cache hit, cache miss, Cloudflare KV failure fallback
- `lib/rate-limit/search-limits.test.ts` — limit enforcement per tier, non-cloud bypass

Run the full test suite with `bun run test` after all changes and confirm no regressions.

---

## Out of Scope

- Changes to the Parallel Search API integration itself
- Changes to the Evidence Scoring algorithm
- UI changes
- Any new database migrations