/**
 * Pure evidence scoring library for AgriEvidence.
 *
 * Evaluates the trustworthiness of an AI-generated assistant message by
 * examining the sources cited (source-url / source-document parts) and the
 * search metadata (tool-search parts).  No database access — all inputs are
 * passed in so the function is fully unit-testable.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Subset of the `sources` table row needed for scoring. */
export interface CuratedSource {
  domain: string
  sourceType:
    | 'research'
    | 'government'
    | 'extension'
    | 'news'
    | 'database'
    | 'marketplace'
  trustScore: number
}

export interface EvidenceBreakdown {
  /** Sources matching research or database type in curated list. */
  peer_reviewed_count: number
  /** Sources matching government or extension type in curated list. */
  government_count: number
  /** Sources not matched in the curated list. */
  web_general_count: number
  total_sources: number
  /** Mean trust_score of all matched curated sources, or null if none matched. */
  avg_curated_trust: number | null
  /** Whether any search fell back to open-web results. */
  used_fallback: boolean
  /** Dominant source type based on counts. */
  primary_source_type:
    | 'peer_reviewed'
    | 'government'
    | 'mixed'
    | 'web_general'
    | 'none'
}

export interface EvidenceScore {
  /** Overall trustworthiness score 0–100. */
  overall: number
  breakdown: EvidenceBreakdown
  /** Human-readable quality label. */
  label: 'High' | 'Moderate' | 'Low' | 'Insufficient'
  /** ISO timestamp when the score was computed. */
  computed_at: string
}

// Minimal part shapes consumed by the scorer — avoids importing the full AI SDK
// or creating a circular dependency with the streaming layer.
type SourceUrlPart = {
  type: 'source-url'
  url: string
}

type SourceDocumentPart = {
  type: 'source-document'
  url: string
}

type ToolSearchOutputMeta = {
  openWebResults?: number
}

type ToolSearchOutput = {
  state?: string
  metadata?: ToolSearchOutputMeta
}

type ToolSearchPart = {
  type: 'tool-search'
  state?: string
  output?: ToolSearchOutput
}

type ScorerPart =
  | SourceUrlPart
  | SourceDocumentPart
  | ToolSearchPart
  | { type: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function matchesDomain(hostname: string, curated: string): boolean {
  const norm = curated.trim().toLowerCase().replace(/^www\./, '')
  return hostname === norm || hostname.endsWith(`.${norm}`)
}

// ─── Core scoring function ───────────────────────────────────────────────────

/**
 * Computes an evidence score for an assistant message given its parts and the
 * current curated-sources list.
 *
 * @param parts - The `UIMessage.parts` array (typed loosely so callers don't
 *   need to import the full AI SDK types).
 * @param curatedSources - Active rows from the `sources` table (only the three
 *   fields needed for scoring).
 */
export function computeEvidenceScore(
  parts: ReadonlyArray<{ type: string; [key: string]: unknown }>,
  curatedSources: ReadonlyArray<CuratedSource>
): EvidenceScore {
  // ── 1. Collect source URLs ─────────────────────────────────────────────────
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

  // ── 2. Classify each source ────────────────────────────────────────────────
  let peer_reviewed_count = 0
  let government_count = 0
  let web_general_count = 0
  const matchedTrustScores: number[] = []

  for (const url of sourceUrls) {
    const hostname = extractHostname(url)
    if (!hostname) {
      web_general_count++
      continue
    }

    const match = curatedSources.find(s => matchesDomain(hostname, s.domain))

    if (!match) {
      web_general_count++
      continue
    }

    matchedTrustScores.push(match.trustScore)

    if (match.sourceType === 'research' || match.sourceType === 'database') {
      peer_reviewed_count++
    } else if (
      match.sourceType === 'government' ||
      match.sourceType === 'extension'
    ) {
      government_count++
    } else {
      // news / marketplace — matched but not peer-reviewed / government
      web_general_count++
    }
  }

  const total_sources = sourceUrls.length

  // ── 3. avg_curated_trust ─────────────────────────────────────────────────-
  const avg_curated_trust =
    matchedTrustScores.length > 0
      ? Math.round(
          matchedTrustScores.reduce((a, b) => a + b, 0) /
            matchedTrustScores.length
        )
      : null

  // ── 4. Detect fallback ────────────────────────────────────────────────────
  let used_fallback = false

  for (const part of parts) {
    if (part.type === 'tool-search') {
      const p = part as unknown as ToolSearchPart
      if (
        p.state === 'output-available' &&
        p.output &&
        typeof p.output.metadata?.openWebResults === 'number' &&
        p.output.metadata.openWebResults > 0
      ) {
        used_fallback = true
        break
      }
    }
  }

  // ── 5. Compute overall score ──────────────────────────────────────────────
  let base =
    (peer_reviewed_count * 40 + government_count * 25) /
    Math.max(total_sources, 1)
  base = Math.min(base, 75)

  const trust_bonus =
    avg_curated_trust !== null ? (avg_curated_trust / 100) * 20 : 0
  const fallback_penalty = used_fallback ? 10 : 0

  const overall = Math.round(
    Math.max(0, Math.min(100, base + trust_bonus - fallback_penalty))
  )

  // ── 6. Label ──────────────────────────────────────────────────────────────
  let label: EvidenceScore['label']
  if (overall >= 70) {
    label = 'High'
  } else if (overall >= 45) {
    label = 'Moderate'
  } else if (overall >= 20) {
    label = 'Low'
  } else {
    label = 'Insufficient'
  }

  // ── 7. Primary source type ────────────────────────────────────────────────
  let primary_source_type: EvidenceBreakdown['primary_source_type']

  if (total_sources === 0) {
    primary_source_type = 'none'
  } else if (peer_reviewed_count === 0 && government_count === 0) {
    primary_source_type = 'web_general'
  } else if (peer_reviewed_count > 0 && government_count === 0) {
    primary_source_type = 'peer_reviewed'
  } else if (government_count > 0 && peer_reviewed_count === 0) {
    primary_source_type = 'government'
  } else {
    primary_source_type = 'mixed'
  }

  return {
    overall,
    label,
    computed_at: new Date().toISOString(),
    breakdown: {
      peer_reviewed_count,
      government_count,
      web_general_count,
      total_sources,
      avg_curated_trust,
      used_fallback,
      primary_source_type
    }
  }
}

// ─── UI helper ────────────────────────────────────────────────────────────────

/**
 * Returns a Tailwind CSS color class family for the given evidence label.
 * Intended for use as a prefix — callers append `-500`, `-600`, etc. as needed.
 */
export function getScoreColor(
  label: EvidenceScore['label']
): 'green' | 'amber' | 'orange' | 'red' {
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
