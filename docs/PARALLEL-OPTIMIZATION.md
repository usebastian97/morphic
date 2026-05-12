# Parallel Search Optimization

SwissTaxSearch uses Parallel Search as the active search backend for official Swiss tax research.

Every informational chat turn may trigger:

1. Query enrichment in `lib/swiss-tax/query-enricher.ts`
2. Official domain resolution in `lib/tools/swiss-tax-search.ts`
3. Parallel Search with `source_policy.include_domains`
4. Defensive result filtering through `lib/swiss-tax/official-domain-policy.ts`

## Current Controls

- Official-only domain policy from `official_sources` plus static Swiss government fallbacks
- Open-web fallback disabled
- Result deduplication by normalized URL
- Target result count capped at 8
- Domain cache TTL of 10 minutes
- Query enrichment timeout of 3 seconds with raw-query fallback
- Credit preflight before authenticated streams

## Recommended Next Optimizations

| Priority | Change                                                                  | Files                                                              |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1        | Cap enriched queries by mode: Speed 1, Quality 2                        | `lib/swiss-tax/query-enricher.ts`, `lib/tools/swiss-tax-search.ts` |
| 2        | Add search result cache keyed by query, mode, canton, and taxpayer type | `lib/tools/search-cache.ts`                                        |
| 3        | Add sub-query similarity deduplication                                  | `lib/swiss-tax/query-enricher.ts`                                  |
| 4        | Add telemetry for official coverage gaps                                | `lib/supabase/queries/analytics.ts`                                |
| 5        | Add tests for official domain filtering and scoring                     | `lib/swiss-tax/*.test.ts`                                          |

## Important Constraint

Do not add open-web fallback. If official Swiss tax coverage is thin, the assistant should report that limitation rather than using unofficial sources.
