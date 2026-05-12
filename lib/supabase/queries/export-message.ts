/**
 * Query helper for PDF export.
 *
 * Assembles MessageExportData by fetching:
 * - The assistant message and its parts (text + source parts)
 * - The preceding user query from the same chat
 * - Official source metadata matched by domain
 *
 * This module is server-side only. The caller must pass an RLS-enforced
 * Supabase client so ownership is validated before data is returned.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Source } from '@/lib/supabase/types'
import type { EvidenceScore } from '@/lib/swiss-tax/official-source-score'

import { getAllSources } from './sources'

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single cited source enriched with curated metadata when available. */
export interface ExportSource {
  /** 1-based index for display in the PDF. */
  index: number
  title: string
  url: string
  domain: string
  /** Snippet extracted from the page, if available. */
  snippet: string | null
  /** Official source type label for display (e.g. "Tax authority", "Forms"). */
  sourceTypeLabel: string | null
  /** 0-100 trust score from the official sources list, or null if not matched. */
  trustScore: number | null
}

/** Full data bundle returned by the export endpoint and consumed by the PDF generator. */
export interface MessageExportData {
  messageId: string
  /** The original user question that prompted this assistant message. */
  userQuery: string
  /** Full answer text with all text parts concatenated (markdown intact). */
  answerText: string
  /** Evidence score from messages.metadata, or null if not yet computed. */
  evidenceScore: EvidenceScore | null
  /** Deduplicated list of cited sources in order of first appearance. */
  sources: ExportSource[]
  /** ISO date string for display on the PDF cover. */
  exportedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extracts the bare hostname from a URL, lowercased without www. */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return hostname.startsWith('www.') ? hostname.slice(4) : hostname
  } catch {
    return url
  }
}

/** Matches a URL's hostname against an official source domain (handles subdomains). */
function matchesDomain(urlDomain: string, curatedDomain: string): boolean {
  const norm = curatedDomain
    .trim()
    .toLowerCase()
    .replace(/^www\./, '')
  return urlDomain === norm || urlDomain.endsWith(`.${norm}`)
}

/** Capitalises the first letter of a string. */
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Builds the display label for a source type. */
function sourceTypeLabel(sourceType: Source['sourceType']): string {
  const map: Record<Source['sourceType'], string> = {
    tax_authority: 'Tax authority',
    official_portal: 'Official portal',
    legal_database: 'Legal database',
    official_news: 'Official news',
    statistics: 'Statistics',
    forms: 'Forms'
  }
  return map[sourceType] ?? capitalise(sourceType)
}

// ─── Main query function ──────────────────────────────────────────────────────

/**
 * Assembles all data needed to render the PDF for a given assistant message.
 *
 * @param messageId - ID of the assistant `messages` row.
 * @param supabase  - RLS-enforced Supabase client (server session).
 * @returns Assembled `MessageExportData`, or `null` if the message is not found
 *          or RLS denies access.
 */
export async function getMessageExportData(
  messageId: string,
  supabase: SupabaseClient
): Promise<MessageExportData | null> {
  // ── 1. Fetch the assistant message row ────────────────────────────────────
  const { data: msgRow, error: msgError } = await supabase
    .from('messages')
    .select('id, chat_id, metadata')
    .eq('id', messageId)
    .single()

  if (msgError) {
    if (msgError.code === 'PGRST116') return null
    throw msgError
  }
  if (!msgRow) return null

  const chatId = msgRow.chat_id as string
  const metadata = (msgRow.metadata ?? {}) as Record<string, unknown>
  const evidenceScore = (metadata.evidence_score ??
    null) as EvidenceScore | null

  // ── 2. Fetch parts for this message ───────────────────────────────────────
  const { data: parts, error: partsError } = await supabase
    .from('parts')
    .select(
      'type, text_text, source_url_url, source_url_title, source_document_url, source_document_title, source_document_snippet, "order"'
    )
    .eq('message_id', messageId)
    .order('order', { ascending: true })

  if (partsError) throw partsError

  // Concatenate text parts into full answer
  const answerText = (parts ?? [])
    .filter((p: any) => p.type === 'text' && p.text_text)
    .map((p: any) => p.text_text as string)
    .join('\n\n')
    .trim()

  // ── 3. Collect source URLs from source parts ───────────────────────────────
  type SourceEntry = {
    url: string
    title: string | null
    snippet: string | null
  }
  const seen = new Set<string>()
  const rawSources: SourceEntry[] = []

  for (const p of parts ?? []) {
    if (p.type === 'source-url' && p.source_url_url) {
      const url = p.source_url_url as string
      if (!seen.has(url)) {
        seen.add(url)
        rawSources.push({
          url,
          title: (p.source_url_title as string | null) ?? null,
          snippet: null
        })
      }
    } else if (p.type === 'source-document' && p.source_document_url) {
      const url = p.source_document_url as string
      if (!seen.has(url)) {
        seen.add(url)
        rawSources.push({
          url,
          title: (p.source_document_title as string | null) ?? null,
          snippet: (p.source_document_snippet as string | null) ?? null
        })
      }
    }
  }

  // ── 4. Fetch user query — latest user message in the same chat before this one ──
  const { data: userMsgRow } = await supabase
    .from('messages')
    .select('id')
    .eq('chat_id', chatId)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let userQuery = ''
  if (userMsgRow) {
    const { data: userParts } = await supabase
      .from('parts')
      .select('text_text')
      .eq('message_id', userMsgRow.id)
      .eq('type', 'text')
      .order('order', { ascending: true })
      .limit(1)
      .single()

    if (userParts?.text_text) {
      userQuery = userParts.text_text as string
    }
  }

  // ── 5. Match sources against official source list ─────────────────────────
  // getAllSources uses a module-level 10-min TTL cache — safe to call per-request
  const allOfficialSources = await getAllSources(supabase)

  const sources: ExportSource[] = rawSources.map((s, i) => {
    const domain = extractDomain(s.url)
    const match = allOfficialSources.find(cs =>
      matchesDomain(domain, cs.domain)
    )
    return {
      index: i + 1,
      title: s.title ?? domain,
      url: s.url,
      domain,
      snippet: s.snippet,
      sourceTypeLabel: match ? sourceTypeLabel(match.sourceType) : null,
      trustScore: match ? match.trustScore : null
    }
  })

  return {
    messageId,
    userQuery,
    answerText,
    evidenceScore,
    sources,
    exportedAt: new Date().toISOString()
  }
}
