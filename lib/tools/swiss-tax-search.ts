import { tool } from 'ai'
import Parallel from 'parallel-web'

import { getSearchSchemaForModel } from '@/lib/schema/search'
import { getAllSources } from '@/lib/supabase/queries/sources'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/supabase/types'
import {
  filterOfficialUrls,
  STATIC_OFFICIAL_SWISS_TAX_DOMAINS,
  uniqueDomains
} from '@/lib/swiss-tax/official-domain-policy'
import { enrichQuery } from '@/lib/swiss-tax/query-enricher'
import { SearchResultItem, SearchResults } from '@/lib/types'
import { getSearchToolDescription } from '@/lib/utils/search-config'

const OFFICIAL_DOMAINS_CACHE_TTL_MS = 10 * 60 * 1000
const TARGET_RESULT_COUNT = 8
const PARALLEL_DOMAIN_LIMIT = 200

type ParallelSearchResponse = Awaited<ReturnType<Parallel['search']>>

let officialDomainsCache:
  | {
      expiresAt: number
      domains: string[]
    }
  | undefined

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    parsed.hostname = parsed.hostname.replace(/^www\./, '').toLowerCase()
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, '')
  }
}

function createObjective(query: string): string {
  const compactQuery = query.trim().replace(/\s+/g, ' ').slice(0, 500)
  return `Find official Swiss federal, cantonal, or municipal tax sources that answer this user question: "${compactQuery}". Use only official government, tax authority, legal database, official news, statistics, or tax form pages. Capture federal/canton applicability, dates, forms, deadlines, and legal basis when available.`
}

function createParallelClient(): Parallel {
  const apiKey = process.env.PARALLEL_API_KEY
  if (!apiKey) {
    throw new Error('PARALLEL_API_KEY is not set in the environment variables')
  }

  return new Parallel({ apiKey, timeout: 15000, maxRetries: 1 })
}

export async function getOfficialSwissTaxDomains(): Promise<string[]> {
  const now = Date.now()
  if (officialDomainsCache && officialDomainsCache.expiresAt > now) {
    return officialDomainsCache.domains
  }

  try {
    const db = await createClient()
    const sources = await getAllSources(db)
    const domains = uniqueDomains([
      ...STATIC_OFFICIAL_SWISS_TAX_DOMAINS,
      ...sources.map(source => source.domain)
    ]).slice(0, PARALLEL_DOMAIN_LIMIT)

    officialDomainsCache = {
      domains,
      expiresAt: now + OFFICIAL_DOMAINS_CACHE_TTL_MS
    }

    return domains
  } catch (error) {
    console.warn('[SwissTaxSearch] Failed to fetch official domains:', error)
    const fallbackDomains = uniqueDomains([
      ...STATIC_OFFICIAL_SWISS_TAX_DOMAINS
    ])
    officialDomainsCache = {
      domains: fallbackDomains,
      expiresAt: now + OFFICIAL_DOMAINS_CACHE_TTL_MS
    }
    return fallbackDomains
  }
}

async function runParallelSearch({
  client,
  query,
  objective,
  mode,
  includeDomains,
  excludeDomains,
  maxResults,
  clientModel
}: {
  client: Parallel
  query: string
  objective: string
  mode: 'basic' | 'advanced'
  includeDomains: string[]
  excludeDomains: string[]
  maxResults: number
  clientModel: string
}): Promise<ParallelSearchResponse> {
  const cappedExcludeDomains = excludeDomains.slice(0, PARALLEL_DOMAIN_LIMIT)
  const cappedIncludeDomains = includeDomains.slice(
    0,
    Math.max(0, PARALLEL_DOMAIN_LIMIT - cappedExcludeDomains.length)
  )

  return client.search({
    objective,
    search_queries: [query],
    mode,
    client_model: clientModel,
    max_chars_total: 12000,
    advanced_settings: {
      max_results: maxResults,
      source_policy: {
        include_domains: cappedIncludeDomains,
        ...(cappedExcludeDomains.length > 0
          ? { exclude_domains: cappedExcludeDomains }
          : {})
      }
    }
  })
}

function mapParallelResults(
  response: ParallelSearchResponse
): SearchResultItem[] {
  return response.results.map(result => {
    const published = result.publish_date
      ? `Published: ${result.publish_date}\n\n`
      : ''
    const content = `${published}${result.excerpts.join('\n\n')}`.trim()

    return {
      title: result.title || result.url,
      url: result.url,
      content
    }
  })
}

function mergeResults(items: SearchResultItem[]): SearchResultItem[] {
  const seenUrls = new Set<string>()
  const merged: SearchResultItem[] = []

  for (const item of items) {
    const normalizedUrl = normalizeUrl(item.url)
    if (seenUrls.has(normalizedUrl)) continue

    seenUrls.add(normalizedUrl)
    merged.push(item)
  }

  return merged.slice(0, TARGET_RESULT_COUNT)
}

function createCitationMap(
  results: SearchResultItem[]
): Record<number, SearchResultItem> {
  return results.reduce<Record<number, SearchResultItem>>(
    (acc, result, index) => {
      acc[index + 1] = result
      return acc
    },
    {}
  )
}

export async function runSwissTaxSearch({
  query,
  maxResults = TARGET_RESULT_COUNT,
  searchDepth = 'basic',
  includeDomains = [],
  excludeDomains = [],
  modelId,
  toolCallId,
  userProfile
}: {
  query: string
  maxResults?: number
  searchDepth?: 'basic' | 'advanced'
  includeDomains?: string[]
  excludeDomains?: string[]
  modelId: string
  toolCallId?: string
  userProfile?: UserProfile | null
}): Promise<SearchResults> {
  const client = createParallelClient()
  const officialDomains = await getOfficialSwissTaxDomains()
  const requestedOfficialDomains = uniqueDomains(includeDomains).filter(
    domain => officialDomains.includes(domain)
  )
  const includeDomainFilter =
    requestedOfficialDomains.length > 0
      ? requestedOfficialDomains
      : officialDomains
  const excludeDomainFilter = uniqueDomains(excludeDomains)
  const objective = createObjective(query)
  const mode = searchDepth === 'advanced' ? 'advanced' : 'basic'
  const targetResults = Math.min(
    maxResults || TARGET_RESULT_COUNT,
    TARGET_RESULT_COUNT
  )
  const enrichedQueries = await enrichQuery(query, userProfile)

  const responses = await Promise.all(
    enrichedQueries.map(enrichedQuery =>
      runParallelSearch({
        client,
        query: enrichedQuery,
        objective,
        mode,
        includeDomains: includeDomainFilter,
        excludeDomains: excludeDomainFilter,
        maxResults: TARGET_RESULT_COUNT,
        clientModel: modelId.replace(/^[^:]+:/, '')
      })
    )
  )

  const allItems = responses.flatMap(mapParallelResults)
  const officialItems = filterOfficialUrls(allItems, includeDomainFilter)
  const nonOfficialResults = allItems.length - officialItems.length
  const results = mergeResults(officialItems).slice(0, targetResults)
  const searchIds = responses.map(response => response.search_id)
  const sessionIds = Array.from(
    new Set(responses.map(response => response.session_id))
  )

  return {
    results,
    images: [],
    query,
    number_of_results: results.length,
    citationMap: createCitationMap(results),
    ...(toolCallId ? { toolCallId } : {}),
    metadata: {
      provider: 'parallel',
      sourcePolicy: 'official_swiss_tax_only',
      enrichedQueries,
      officialDomainsCount: includeDomainFilter.length,
      officialResults: results.length,
      nonOfficialResults,
      openWebResults: 0,
      searchIds,
      sessionIds
    }
  }
}

export function createSwissTaxSearchTool(
  fullModel: string,
  userProfile?: UserProfile | null
) {
  return tool({
    description: getSearchToolDescription(),
    inputSchema: getSearchSchemaForModel(fullModel),
    async *execute(
      {
        query,
        max_results = TARGET_RESULT_COUNT,
        search_depth = 'basic',
        include_domains = [],
        exclude_domains = []
      },
      context
    ) {
      yield {
        state: 'searching' as const,
        query
      }

      const searchResult = await runSwissTaxSearch({
        query,
        maxResults: max_results,
        searchDepth: search_depth as 'basic' | 'advanced',
        includeDomains: include_domains,
        excludeDomains: exclude_domains,
        modelId: fullModel,
        toolCallId: context?.toolCallId,
        userProfile
      })

      yield {
        state: 'complete' as const,
        ...searchResult
      }
    }
  })
}
