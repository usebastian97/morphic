/**
 * TypeScript types for Supabase database tables.
 * These mirror the DB schema and replace the Drizzle InferSelectModel types.
 */

export type Chat = {
  id: string
  createdAt: Date
  title: string
  userId: string
  visibility: 'public' | 'private'
}

export type Message = {
  id: string
  chatId: string
  role: string
  createdAt: Date
  updatedAt: Date | null
  metadata: Record<string, any> | null
}

export type Part = {
  id: string
  messageId: string
  order: number
  type: string
  text_text: string | null
  reasoning_text: string | null
  file_mediaType: string | null
  file_filename: string | null
  file_url: string | null
  source_url_sourceId: string | null
  source_url_url: string | null
  source_url_title: string | null
  source_document_sourceId: string | null
  source_document_mediaType: string | null
  source_document_title: string | null
  source_document_filename: string | null
  source_document_url: string | null
  source_document_snippet: string | null
  tool_toolCallId: string | null
  tool_state: string | null
  tool_errorText: string | null
  tool_search_input: any
  tool_search_output: any
  tool_fetch_input: any
  tool_fetch_output: any
  tool_question_input: any
  tool_question_output: any
  tool_todoWrite_input: any
  tool_todoWrite_output: any
  tool_todoRead_input: any
  tool_todoRead_output: any
  tool_dynamic_input: any
  tool_dynamic_output: any
  tool_dynamic_name: string | null
  tool_dynamic_type: string | null
  data_prefix: string | null
  data_content: any
  data_id: string | null
  providerMetadata: Record<string, any> | null
  createdAt: Date
}

export type PartInsert = Omit<Part, 'id' | 'createdAt'> & {
  id?: string
  createdAt?: Date
}

export type Feedback = {
  id: string
  userId: string | null
  sentiment: 'positive' | 'neutral' | 'negative'
  message: string
  pageUrl: string
  userAgent: string | null
  createdAt: Date
}

// ---- Row mappers (Supabase snake_case → TypeScript camelCase) ----

export function mapChatRow(row: any): Chat {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    title: row.title,
    userId: row.user_id,
    visibility: row.visibility as 'public' | 'private'
  }
}

export function mapMessageRow(row: any): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    role: row.role,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    metadata: row.metadata ?? null
  }
}

export function mapPartRow(row: any): Part {
  return {
    id: row.id,
    messageId: row.message_id,
    order: row.order,
    type: row.type,
    text_text: row.text_text ?? null,
    reasoning_text: row.reasoning_text ?? null,
    file_mediaType: row.file_media_type ?? null,
    file_filename: row.file_filename ?? null,
    file_url: row.file_url ?? null,
    source_url_sourceId: row.source_url_source_id ?? null,
    source_url_url: row.source_url_url ?? null,
    source_url_title: row.source_url_title ?? null,
    source_document_sourceId: row.source_document_source_id ?? null,
    source_document_mediaType: row.source_document_media_type ?? null,
    source_document_title: row.source_document_title ?? null,
    source_document_filename: row.source_document_filename ?? null,
    source_document_url: row.source_document_url ?? null,
    source_document_snippet: row.source_document_snippet ?? null,
    tool_toolCallId: row.tool_tool_call_id ?? null,
    tool_state: row.tool_state ?? null,
    tool_errorText: row.tool_error_text ?? null,
    tool_search_input: row.tool_search_input ?? null,
    tool_search_output: row.tool_search_output ?? null,
    tool_fetch_input: row.tool_fetch_input ?? null,
    tool_fetch_output: row.tool_fetch_output ?? null,
    tool_question_input: row.tool_question_input ?? null,
    tool_question_output: row.tool_question_output ?? null,
    tool_todoWrite_input: row['tool_todoWrite_input'] ?? null,
    tool_todoWrite_output: row['tool_todoWrite_output'] ?? null,
    tool_todoRead_input: row['tool_todoRead_input'] ?? null,
    tool_todoRead_output: row['tool_todoRead_output'] ?? null,
    tool_dynamic_input: row.tool_dynamic_input ?? null,
    tool_dynamic_output: row.tool_dynamic_output ?? null,
    tool_dynamic_name: row.tool_dynamic_name ?? null,
    tool_dynamic_type: row.tool_dynamic_type ?? null,
    data_prefix: row.data_prefix ?? null,
    data_content: row.data_content ?? null,
    data_id: row.data_id ?? null,
    providerMetadata: row.provider_metadata ?? null,
    createdAt: new Date(row.created_at)
  }
}

// ============================================================
// SwissTaxSearch – domain types
// ============================================================

export type CantonCode =
  | 'AG'
  | 'AI'
  | 'AR'
  | 'BE'
  | 'BL'
  | 'BS'
  | 'FR'
  | 'GE'
  | 'GL'
  | 'GR'
  | 'JU'
  | 'LU'
  | 'NE'
  | 'NW'
  | 'OW'
  | 'SG'
  | 'SH'
  | 'SO'
  | 'SZ'
  | 'TG'
  | 'TI'
  | 'UR'
  | 'VD'
  | 'VS'
  | 'ZG'
  | 'ZH'

export type TaxpayerType =
  | 'individual'
  | 'self_employed'
  | 'business'
  | 'expat'
  | 'advisor'
  | 'institution'

export type PreferredLanguage = 'de' | 'fr' | 'it' | 'en'

export type SubscriptionTier = 'free' | 'pro' | 'plus' | 'max'

export type SwissCanton = {
  code: CantonCode
  nameDe: string
  nameFr: string
  nameIt: string
  nameEn: string
  officialDomain: string
  taxOfficeUrl: string | null
  languages: string[]
  createdAt: Date
}

export type UserProfile = {
  id: string
  fullName: string | null
  avatarUrl: string | null
  bio: string | null
  cantonCode: CantonCode | null
  municipality: string | null
  taxpayerType: TaxpayerType
  preferredLanguage: PreferredLanguage
  subscriptionTier: SubscriptionTier
  onboardingCompleted: boolean
  lastSeenAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type TaxTopic = {
  id: string
  slug: string
  name: string
  nameDe: string | null
  nameFr: string | null
  nameIt: string | null
  nameEn: string | null
  description: string | null
  parentId: string | null
  icon: string | null
  color: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
}

export type Topic = TaxTopic

export type ChatTaxTopic = {
  chatId: string
  topicId: string
  confidence: number | null
}

export type SourceType =
  | 'tax_authority'
  | 'official_portal'
  | 'legal_database'
  | 'official_news'
  | 'statistics'
  | 'forms'

export type JurisdictionLevel = 'federal' | 'canton' | 'municipality'

export type OfficialSource = {
  id: string
  slug: string
  name: string
  baseUrl: string
  domain: string
  description: string | null
  logoUrl: string | null
  jurisdictionLevel: JurisdictionLevel
  cantonCode: CantonCode | null
  municipality: string | null
  sourceType: SourceType
  languages: string[]
  trustScore: number
  isActive: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
}

export type Source = OfficialSource

export type Collection = {
  id: string
  userId: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  isPublic: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type Bookmark = {
  id: string
  userId: string
  collectionId: string | null
  chatId: string | null
  url: string | null
  title: string | null
  description: string | null
  thumbnailUrl: string | null
  notes: string | null
  tags: string[]
  createdAt: Date
}

export type TrendingPeriod = 'daily' | 'weekly' | 'monthly'

export type TaxSearchEvent = {
  id: string
  userId: string | null
  query: string
  chatId: string | null
  taxTopicIds: string[]
  providersUsed: string[]
  resultCount: number | null
  latencyMs: number | null
  countryCode: string | null
  cantonCode: CantonCode | null
  municipality: string | null
  taxpayerType: TaxpayerType | null
  platform: string | null
  hasEngagement: boolean
  createdAt: Date
}

export type SearchEvent = TaxSearchEvent

export type TrendingTaxQuery = {
  id: string
  query: string
  taxTopicId: string | null
  period: TrendingPeriod
  queryCount: number
  countryCode: string | null
  cantonCode: CantonCode | null
  computedAt: Date
}

export type TrendingQuery = TrendingTaxQuery

export type AlertType =
  | 'deadline'
  | 'law_change'
  | 'rate_change'
  | 'form_update'
  | 'official_news'
  | 'guidance_update'

export type AlertFrequency = 'immediate' | 'daily' | 'weekly'
export type AlertChannel = 'email' | 'push' | 'webhook'

export type AlertSubscription = {
  id: string
  userId: string
  name: string
  alertType: AlertType
  taxTopicId: string | null
  keywords: string[]
  cantonCodes: CantonCode[]
  channels: AlertChannel[]
  frequency: AlertFrequency
  webhookUrl: string | null
  isActive: boolean
  lastSentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type PolarStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'trialing'
  | 'paused'

export type Subscription = {
  id: string
  userId: string
  tier: SubscriptionTier
  monthlyCredits: number
  creditsBalance: number
  rolloverCredits: number
  topupCredits: number
  currentPeriodStart: Date
  currentPeriodEnd: Date
  polarCustomerId: string | null
  polarSubscriptionId: string | null
  polarProductId: string | null
  polarStatus: PolarStatus
  cancelAtPeriodEnd: boolean
  trialEnd: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CreditType = 'monthly' | 'rollover' | 'topup'
export type CreditOperation =
  | 'monthly_grant'
  | 'rollover'
  | 'speed_search'
  | 'quality_search'
  | 'deep_research'
  | 'topup_purchase'
  | 'topup_expiry'
  | 'promo'
  | 'refund'

export type CreditLedgerEntry = {
  id: string
  userId: string
  amount: number
  creditType: CreditType
  operation: CreditOperation
  polarOrderId: string | null
  chatId: string | null
  messageId: string | null
  description: string | null
  expiresAt: Date | null
  balanceAfter: number
  createdAt: Date
}

// ---- SwissTaxSearch row mappers ----

export function mapSwissCantonRow(row: any): SwissCanton {
  return {
    code: row.code as CantonCode,
    nameDe: row.name_de,
    nameFr: row.name_fr,
    nameIt: row.name_it,
    nameEn: row.name_en,
    officialDomain: row.official_domain,
    taxOfficeUrl: row.tax_office_url ?? null,
    languages: row.languages ?? [],
    createdAt: new Date(row.created_at)
  }
}

export function mapUserProfileRow(row: any): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? null,
    avatarUrl: row.avatar_url ?? null,
    bio: row.bio ?? null,
    cantonCode: (row.canton_code ?? null) as CantonCode | null,
    municipality: row.municipality ?? null,
    taxpayerType: row.taxpayer_type as TaxpayerType,
    preferredLanguage: row.preferred_language as PreferredLanguage,
    subscriptionTier: row.subscription_tier as SubscriptionTier,
    onboardingCompleted: row.onboarding_completed,
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }
}

export function mapTaxTopicRow(row: any): TaxTopic {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameDe: row.name_de ?? null,
    nameFr: row.name_fr ?? null,
    nameIt: row.name_it ?? null,
    nameEn: row.name_en ?? null,
    description: row.description ?? null,
    parentId: row.parent_id ?? null,
    icon: row.icon ?? null,
    color: row.color ?? null,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: new Date(row.created_at)
  }
}

export const mapTopicRow = mapTaxTopicRow

export function mapOfficialSourceRow(row: any): OfficialSource {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    baseUrl: row.base_url,
    domain: row.domain,
    description: row.description ?? null,
    logoUrl: row.logo_url ?? null,
    jurisdictionLevel: row.jurisdiction_level as JurisdictionLevel,
    cantonCode: (row.canton_code ?? null) as CantonCode | null,
    municipality: row.municipality ?? null,
    sourceType: row.source_type as SourceType,
    languages: row.languages ?? [],
    trustScore: row.trust_score,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }
}

export const mapSourceRow = mapOfficialSourceRow

export function mapCollectionRow(row: any): Collection {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? null,
    icon: row.icon ?? null,
    color: row.color ?? null,
    isPublic: row.is_public,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }
}

export function mapBookmarkRow(row: any): Bookmark {
  return {
    id: row.id,
    userId: row.user_id,
    collectionId: row.collection_id ?? null,
    chatId: row.chat_id ?? null,
    url: row.url ?? null,
    title: row.title ?? null,
    description: row.description ?? null,
    thumbnailUrl: row.thumbnail_url ?? null,
    notes: row.notes ?? null,
    tags: row.tags ?? [],
    createdAt: new Date(row.created_at)
  }
}

export function mapSearchEventRow(row: any): SearchEvent {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    query: row.query,
    chatId: row.chat_id ?? null,
    taxTopicIds: row.tax_topic_ids ?? [],
    providersUsed: row.providers_used ?? [],
    resultCount: row.result_count ?? null,
    latencyMs: row.latency_ms ?? null,
    countryCode: row.country_code ?? null,
    cantonCode: (row.canton_code ?? null) as CantonCode | null,
    municipality: row.municipality ?? null,
    taxpayerType: (row.taxpayer_type ?? null) as TaxpayerType | null,
    platform: row.platform ?? null,
    hasEngagement: row.has_engagement,
    createdAt: new Date(row.created_at)
  }
}

export function mapTrendingQueryRow(row: any): TrendingQuery {
  return {
    id: row.id,
    query: row.query,
    taxTopicId: row.tax_topic_id ?? null,
    period: row.period as TrendingPeriod,
    queryCount: row.query_count,
    countryCode: row.country_code ?? null,
    cantonCode: (row.canton_code ?? null) as CantonCode | null,
    computedAt: new Date(row.computed_at)
  }
}

export function mapAlertSubscriptionRow(row: any): AlertSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    alertType: row.alert_type as AlertType,
    taxTopicId: row.tax_topic_id ?? null,
    keywords: row.keywords ?? [],
    cantonCodes: row.canton_codes ?? [],
    channels: row.channels as AlertChannel[],
    frequency: row.frequency as AlertFrequency,
    webhookUrl: row.webhook_url ?? null,
    isActive: row.is_active,
    lastSentAt: row.last_sent_at ? new Date(row.last_sent_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }
}

export function mapSubscriptionRow(row: any): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    tier: row.tier as SubscriptionTier,
    monthlyCredits: row.monthly_credits,
    creditsBalance: row.credits_balance,
    rolloverCredits: row.rollover_credits,
    topupCredits: row.topup_credits,
    currentPeriodStart: new Date(row.current_period_start),
    currentPeriodEnd: new Date(row.current_period_end),
    polarCustomerId: row.polar_customer_id ?? null,
    polarSubscriptionId: row.polar_subscription_id ?? null,
    polarProductId: row.polar_product_id ?? null,
    polarStatus: row.polar_status as PolarStatus,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    trialEnd: row.trial_end ? new Date(row.trial_end) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }
}

export function mapCreditLedgerRow(row: any): CreditLedgerEntry {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    creditType: row.credit_type as CreditType,
    operation: row.operation as CreditOperation,
    polarOrderId: row.polar_order_id ?? null,
    chatId: row.chat_id ?? null,
    messageId: row.message_id ?? null,
    description: row.description ?? null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    balanceAfter: row.balance_after,
    createdAt: new Date(row.created_at)
  }
}

/** Convert a PartInsert (camelCase field names) to Supabase snake_case row */
export function mapPartInsertToRow(part: PartInsert): Record<string, any> {
  const row: Record<string, any> = {
    message_id: part.messageId,
    order: part.order,
    type: part.type,
    text_text: part.text_text ?? null,
    reasoning_text: part.reasoning_text ?? null,
    file_media_type: part.file_mediaType ?? null,
    file_filename: part.file_filename ?? null,
    file_url: part.file_url ?? null,
    source_url_source_id: part.source_url_sourceId ?? null,
    source_url_url: part.source_url_url ?? null,
    source_url_title: part.source_url_title ?? null,
    source_document_source_id: part.source_document_sourceId ?? null,
    source_document_media_type: part.source_document_mediaType ?? null,
    source_document_title: part.source_document_title ?? null,
    source_document_filename: part.source_document_filename ?? null,
    source_document_url: part.source_document_url ?? null,
    source_document_snippet: part.source_document_snippet ?? null,
    tool_tool_call_id: part.tool_toolCallId ?? null,
    tool_state: part.tool_state ?? null,
    tool_error_text: part.tool_errorText ?? null,
    tool_search_input: part.tool_search_input ?? null,
    tool_search_output: part.tool_search_output ?? null,
    tool_fetch_input: part.tool_fetch_input ?? null,
    tool_fetch_output: part.tool_fetch_output ?? null,
    tool_question_input: part.tool_question_input ?? null,
    tool_question_output: part.tool_question_output ?? null,
    tool_todoWrite_input: part.tool_todoWrite_input ?? null,
    tool_todoWrite_output: part.tool_todoWrite_output ?? null,
    tool_todoRead_input: part.tool_todoRead_input ?? null,
    tool_todoRead_output: part.tool_todoRead_output ?? null,
    tool_dynamic_input: part.tool_dynamic_input ?? null,
    tool_dynamic_output: part.tool_dynamic_output ?? null,
    tool_dynamic_name: part.tool_dynamic_name ?? null,
    tool_dynamic_type: part.tool_dynamic_type ?? null,
    data_prefix: part.data_prefix ?? null,
    data_content: part.data_content ?? null,
    data_id: part.data_id ?? null,
    provider_metadata: part.providerMetadata ?? null
  }

  if (part.id) row.id = part.id

  return row
}
