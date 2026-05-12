import type {
  CantonCode,
  JurisdictionLevel,
  SourceType
} from '@/lib/supabase/types'

import { getHostname } from './official-domain-policy'

export interface CuratedSource {
  domain: string
  sourceType: SourceType
  jurisdictionLevel: JurisdictionLevel
  cantonCode: CantonCode | null
  trustScore: number
}

export interface EvidenceBreakdown {
  federal_count: number
  cantonal_count: number
  municipal_count: number
  legal_or_form_count: number
  official_news_count: number
  non_official_count: number
  total_sources: number
  avg_official_trust: number | null
  used_non_official_results: boolean
  primary_source_type:
    | 'federal'
    | 'cantonal'
    | 'municipal'
    | 'mixed_official'
    | 'non_official'
    | 'none'
}

export interface EvidenceScore {
  overall: number
  breakdown: EvidenceBreakdown
  label: 'High' | 'Moderate' | 'Low' | 'Insufficient'
  computed_at: string
}

type SourceUrlPart = {
  type: 'source-url'
  url: string
}

type SourceDocumentPart = {
  type: 'source-document'
  url: string
}

type ToolSearchPart = {
  type: 'tool-search'
  state?: string
  output?: {
    metadata?: {
      nonOfficialResults?: number
      openWebResults?: number
    }
  }
}

function matchesDomain(hostname: string, curatedDomain: string): boolean {
  const normalized = curatedDomain
    .trim()
    .toLowerCase()
    .replace(/^www\./, '')
  return hostname === normalized || hostname.endsWith(`.${normalized}`)
}

export function computeEvidenceScore(
  parts: ReadonlyArray<{ type: string; [key: string]: unknown }>,
  curatedSources: ReadonlyArray<CuratedSource>
): EvidenceScore {
  const sourceUrls: string[] = []

  for (const part of parts) {
    if (part.type === 'source-url') {
      const url = (part as unknown as SourceUrlPart).url
      if (url) sourceUrls.push(url)
    } else if (part.type === 'source-document') {
      const url = (part as unknown as SourceDocumentPart).url
      if (url) sourceUrls.push(url)
    }
  }

  let federal_count = 0
  let cantonal_count = 0
  let municipal_count = 0
  let legal_or_form_count = 0
  let official_news_count = 0
  let non_official_count = 0
  const officialTrustScores: number[] = []

  for (const url of sourceUrls) {
    const hostname = getHostname(url)
    if (!hostname) {
      non_official_count++
      continue
    }

    const match = curatedSources.find(source =>
      matchesDomain(hostname, source.domain)
    )

    if (!match) {
      non_official_count++
      continue
    }

    officialTrustScores.push(match.trustScore)

    if (match.jurisdictionLevel === 'federal') federal_count++
    if (match.jurisdictionLevel === 'canton') cantonal_count++
    if (match.jurisdictionLevel === 'municipality') municipal_count++

    if (match.sourceType === 'legal_database' || match.sourceType === 'forms') {
      legal_or_form_count++
    }

    if (match.sourceType === 'official_news') {
      official_news_count++
    }
  }

  const total_sources = sourceUrls.length
  const officialCount = federal_count + cantonal_count + municipal_count
  const avg_official_trust =
    officialTrustScores.length > 0
      ? Math.round(
          officialTrustScores.reduce((sum, score) => sum + score, 0) /
            officialTrustScores.length
        )
      : null

  let used_non_official_results = non_official_count > 0
  for (const part of parts) {
    if (part.type !== 'tool-search') continue
    const searchPart = part as unknown as ToolSearchPart
    const metadata = searchPart.output?.metadata
    if (
      searchPart.state === 'output-available' &&
      ((metadata?.nonOfficialResults ?? 0) > 0 ||
        (metadata?.openWebResults ?? 0) > 0)
    ) {
      used_non_official_results = true
      break
    }
  }

  const officialCoverage = total_sources > 0 ? officialCount / total_sources : 0
  const coverageScore = officialCoverage * 55
  const trustScore =
    avg_official_trust !== null ? (avg_official_trust / 100) * 30 : 0
  const legalBonus = Math.min(
    10,
    (legal_or_form_count + official_news_count) * 4
  )
  const nonOfficialPenalty = used_non_official_results ? 20 : 0

  const overall = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        coverageScore + trustScore + legalBonus - nonOfficialPenalty
      )
    )
  )

  let label: EvidenceScore['label']
  if (overall >= 75) {
    label = 'High'
  } else if (overall >= 50) {
    label = 'Moderate'
  } else if (overall >= 25) {
    label = 'Low'
  } else {
    label = 'Insufficient'
  }

  let primary_source_type: EvidenceBreakdown['primary_source_type']
  const officialBuckets = [
    federal_count,
    cantonal_count,
    municipal_count
  ].filter(count => count > 0).length

  if (total_sources === 0) {
    primary_source_type = 'none'
  } else if (officialCount === 0) {
    primary_source_type = 'non_official'
  } else if (officialBuckets > 1) {
    primary_source_type = 'mixed_official'
  } else if (federal_count > 0) {
    primary_source_type = 'federal'
  } else if (cantonal_count > 0) {
    primary_source_type = 'cantonal'
  } else {
    primary_source_type = 'municipal'
  }

  return {
    overall,
    label,
    computed_at: new Date().toISOString(),
    breakdown: {
      federal_count,
      cantonal_count,
      municipal_count,
      legal_or_form_count,
      official_news_count,
      non_official_count,
      total_sources,
      avg_official_trust,
      used_non_official_results,
      primary_source_type
    }
  }
}

export function getScoreColor(label: EvidenceScore['label']) {
  switch (label) {
    case 'High':
      return 'green'
    case 'Moderate':
      return 'amber'
    case 'Low':
      return 'orange'
    case 'Insufficient':
      return 'red'
  }
}
