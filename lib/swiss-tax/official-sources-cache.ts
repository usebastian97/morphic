import { createAdminClient } from '@/lib/supabase/admin'

import type { CuratedSource } from './official-source-score'

const CACHE_TTL_MS = 10 * 60 * 1000

interface OfficialSourcesCache {
  expiresAt: number
  sources: CuratedSource[]
}

let cache: OfficialSourcesCache | undefined

export async function getOfficialSources(): Promise<CuratedSource[]> {
  const now = Date.now()

  if (cache && cache.expiresAt > now) {
    return cache.sources
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('official_sources')
      .select(
        'domain, source_type, jurisdiction_level, canton_code, trust_score'
      )
      .eq('is_active', true)

    if (error) throw error

    const sources: CuratedSource[] = (data ?? []).map(row => ({
      domain: row.domain as string,
      sourceType: row.source_type as CuratedSource['sourceType'],
      jurisdictionLevel:
        row.jurisdiction_level as CuratedSource['jurisdictionLevel'],
      cantonCode: (row.canton_code ?? null) as CuratedSource['cantonCode'],
      trustScore: row.trust_score as number
    }))

    cache = { sources, expiresAt: now + CACHE_TTL_MS }
    return sources
  } catch (error) {
    console.warn(
      '[OfficialSourceScore] Failed to fetch official sources:',
      error
    )
    cache = { sources: [], expiresAt: now + CACHE_TTL_MS }
    return []
  }
}
