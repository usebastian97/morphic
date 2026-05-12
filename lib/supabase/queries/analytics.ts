import type { SupabaseClient } from '@supabase/supabase-js'

import {
  mapSearchEventRow,
  mapTrendingQueryRow,
  type SearchEvent,
  type TrendingPeriod,
  type TrendingQuery
} from '../types'

type DB = SupabaseClient

// ---------------------------------------------------------------
// Search Events (append-only)
// ---------------------------------------------------------------

export async function logSearchEvent(
  db: DB,
  event: Pick<
    SearchEvent,
    | 'userId'
    | 'query'
    | 'chatId'
    | 'taxTopicIds'
    | 'providersUsed'
    | 'resultCount'
    | 'latencyMs'
    | 'countryCode'
    | 'cantonCode'
    | 'municipality'
    | 'taxpayerType'
    | 'platform'
    | 'hasEngagement'
  >
): Promise<void> {
  const { error } = await db.from('tax_search_events').insert({
    user_id: event.userId ?? null,
    query: event.query,
    chat_id: event.chatId ?? null,
    tax_topic_ids: event.taxTopicIds ?? [],
    providers_used: event.providersUsed ?? [],
    result_count: event.resultCount ?? null,
    latency_ms: event.latencyMs ?? null,
    country_code: event.countryCode ?? null,
    canton_code: event.cantonCode ?? null,
    municipality: event.municipality ?? null,
    taxpayer_type: event.taxpayerType ?? null,
    platform: event.platform ?? null,
    has_engagement: event.hasEngagement
  })

  if (error) throw error
}

export async function getUserSearchHistory(
  db: DB,
  userId: string,
  limit = 20
): Promise<SearchEvent[]> {
  const { data, error } = await db
    .from('tax_search_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapSearchEventRow)
}

// ---------------------------------------------------------------
// Trending Queries (read-only from app — populated by cron)
// ---------------------------------------------------------------

export async function getTrendingQueries(
  db: DB,
  period: TrendingPeriod = 'daily',
  limit = 10,
  topicId?: string
): Promise<TrendingQuery[]> {
  let query = db
    .from('trending_tax_queries')
    .select('*')
    .eq('period', period)
    .order('query_count', { ascending: false })
    .limit(limit)

  if (topicId) {
    query = query.eq('tax_topic_id', topicId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapTrendingQueryRow)
}
