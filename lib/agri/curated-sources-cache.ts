/**
 * Module-level in-memory cache for the curated agricultural sources list,
 * used by the evidence scoring system.
 *
 * Caches the subset of `Source` fields needed for evidence scoring with a
 * 10-minute TTL — the same TTL used by the trusted-domain list in
 * `lib/tools/agri-search.ts`.  Kept in a separate file so the pure scoring
 * function (`evidence-score.ts`) stays database-free and easily unit-testable.
 */
import { createAdminClient } from '@/lib/supabase/admin'

import type { CuratedSource } from './evidence-score'

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface CuratedSourcesCache {
  expiresAt: number
  sources: CuratedSource[]
}

let cache: CuratedSourcesCache | undefined

/**
 * Returns the list of active curated sources (domain + sourceType + trustScore)
 * from Supabase, using a module-level 10-minute TTL cache.
 *
 * Uses the admin client (service-role key) so it is safe to call from
 * server-side code only — never expose this function to the browser.
 */
export async function getCuratedSources(): Promise<CuratedSource[]> {
  const now = Date.now()

  if (cache && cache.expiresAt > now) {
    return cache.sources
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('sources')
      .select('domain, source_type, trust_score')
      .eq('is_active', true)

    if (error) throw error

    const sources: CuratedSource[] = (data ?? []).map(row => ({
      domain: row.domain as string,
      sourceType: row.source_type as CuratedSource['sourceType'],
      trustScore: row.trust_score as number
    }))

    cache = { sources, expiresAt: now + CACHE_TTL_MS }
    return sources
  } catch (error) {
    console.warn('[EvidenceScore] Failed to fetch curated sources:', error)
    // Cache empty list briefly to avoid hammering DB on repeated failures
    cache = { sources: [], expiresAt: now + CACHE_TTL_MS }
    return []
  }
}
