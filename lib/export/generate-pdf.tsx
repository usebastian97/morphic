/**
 * Client-side PDF generation for SwissTaxSearch responses.
 *
 * Builds a structured A4 document using @react-pdf/renderer and triggers a
 * browser file download.  This module must only be called in browser context
 * (inside event handlers or useEffect) — never at module level or in RSCs.
 *
 * Import is dynamic inside the function to avoid SSR issues.
 */

import type { MessageExportData } from '@/lib/supabase/queries/export-message'

// ─── Markdown stripping ───────────────────────────────────────────────────────

/**
 * Strips the most common Markdown tokens from a string so the plain text
 * looks clean in the PDF.  This intentionally avoids a full parser —
 * the goal is readability, not round-trippable fidelity.
 */
function stripMarkdown(text: string): string {
  return (
    text
      // Headings
      .replace(/^#{1,6}\s+/gm, '')
      // Bold / italic
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      // Inline code
      .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
      // Links  [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Images  ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Blockquotes
      .replace(/^>\s+/gm, '')
      // Horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // Numbered lists: "1. " → "• "
      .replace(/^\d+\.\s+/gm, '• ')
      // Unordered lists
      .replace(/^[-*+]\s+/gm, '• ')
      // Spec blocks (assistant-specific fenced blocks)
      .replace(/```[\s\S]*?```/g, '')
      // Trailing whitespace on each line
      .replace(/[ \t]+$/gm, '')
      // Collapse 3+ blank lines to 2
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

// ─── Date formatting ──────────────────────────────────────────────────────────

function formatExportDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return isoString
  }
}

// ─── Filename ──────────────────────────────────────────────────────────────────

function buildFilename(messageId: string): string {
  const prefix = messageId.slice(0, 8)
  const date = new Date().toISOString().slice(0, 10)
  return `swiss-tax-search-${prefix}-${date}.pdf`
}

// ─── PDF Document (lazy-built to avoid SSR) ───────────────────────────────────

/**
 * Generates the @react-pdf/renderer Document element and returns it.
 * Separated so it can be passed to both `pdf()` (blob) and `PDFViewer`.
 */
async function buildPdfDocument(data: MessageExportData) {
  // Dynamic import keeps the heavy library out of the server bundle
  const { Document, Page, Text, View, StyleSheet, Font } = await import(
    '@react-pdf/renderer'
  )

  // Use built-in fonts — no external font loading required
  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      paddingTop: 48,
      paddingBottom: 56,
      paddingHorizontal: 56,
      color: '#1a1a1a',
      backgroundColor: '#ffffff'
    },
    // ── Header ──
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4
    },
    logoText: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#166534'
    },
    dateText: {
      fontSize: 9,
      color: '#6b7280'
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: '#d1d5db',
      marginVertical: 12
    },
    // ── Section labels ──
    sectionLabel: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6
    },
    // ── Query block ──
    queryText: {
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      lineHeight: 1.4,
      marginBottom: 4
    },
    // ── Answer block ──
    answerText: {
      fontSize: 10,
      lineHeight: 1.65,
      color: '#374151'
    },
    // ── Evidence score block ──
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4
    },
    scoreBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      fontSize: 10,
      fontFamily: 'Helvetica-Bold'
    },
    scoreBreakdown: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 2
    },
    // ── Sources block ──
    sourceItem: {
      marginBottom: 10
    },
    sourceTitleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 2
    },
    sourceIndex: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      minWidth: 18
    },
    sourceTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      flex: 1
    },
    sourceMeta: {
      fontSize: 9,
      color: '#6b7280',
      marginLeft: 18,
      marginBottom: 2
    },
    sourceSnippet: {
      fontSize: 9,
      color: '#4b5563',
      fontStyle: 'italic',
      marginLeft: 18,
      marginBottom: 2,
      lineHeight: 1.5
    },
    sourceUrl: {
      fontSize: 8,
      color: '#2563eb',
      marginLeft: 18
    },
    // ── Footer ──
    footer: {
      position: 'absolute',
      bottom: 28,
      left: 56,
      right: 56,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    disclaimerText: {
      fontSize: 7,
      color: '#9ca3af',
      fontStyle: 'italic',
      flex: 1,
      marginRight: 12
    },
    pageNumberText: {
      fontSize: 8,
      color: '#9ca3af'
    },
    sectionBlock: {
      marginBottom: 16
    }
  })

  // Score badge colour based on label
  function scoreBadgeStyle(label: string) {
    const map: Record<string, { backgroundColor: string; color: string }> = {
      High: { backgroundColor: '#dcfce7', color: '#166534' },
      Moderate: { backgroundColor: '#fef9c3', color: '#854d0e' },
      Low: { backgroundColor: '#ffedd5', color: '#9a3412' },
      Insufficient: { backgroundColor: '#fee2e2', color: '#991b1b' }
    }
    return map[label] ?? { backgroundColor: '#f3f4f6', color: '#374151' }
  }

  const { evidenceScore, sources } = data
  const cleanAnswer = stripMarkdown(data.answerText)
  const displayDate = formatExportDate(data.exportedAt)

  return (
    <Document
      title={`SwissTaxSearch - ${data.userQuery.slice(0, 80)}`}
      author="SwissTaxSearch"
      subject="Official Swiss Tax Research Export"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.logoText}>SwissTaxSearch</Text>
          <Text style={styles.dateText}>{displayDate}</Text>
        </View>
        <View style={styles.divider} />

        {/* ── Query ──────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Query</Text>
          <Text style={styles.queryText}>{data.userQuery}</Text>
        </View>
        <View style={styles.divider} />

        {/* ── Answer ─────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Answer</Text>
          <Text style={styles.answerText}>{cleanAnswer}</Text>
        </View>

        {/* ── Evidence Score (optional) ───────────────────── */}
        {evidenceScore && (
          <>
            <View style={styles.divider} />
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Evidence Score</Text>
              <View style={styles.scoreRow}>
                <Text
                  style={[
                    styles.scoreBadge,
                    scoreBadgeStyle(evidenceScore.label)
                  ]}
                >
                  {evidenceScore.label}
                </Text>
                <Text style={{ fontSize: 10, color: '#374151' }}>
                  {evidenceScore.overall}/100
                </Text>
              </View>
              <Text style={styles.scoreBreakdown}>
                {evidenceScore.breakdown.federal_count} federal ·{' '}
                {evidenceScore.breakdown.cantonal_count} cantonal ·{' '}
                {evidenceScore.breakdown.municipal_count} municipal
                {evidenceScore.breakdown.used_non_official_results
                  ? ' · non-official source detected'
                  : ''}
              </Text>
            </View>
          </>
        )}

        {/* ── Sources ─────────────────────────────────────── */}
        {sources.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>
                Sources ({sources.length})
              </Text>
              {sources.map(s => (
                <View key={s.index} style={styles.sourceItem}>
                  <View style={styles.sourceTitleRow}>
                    <Text style={styles.sourceIndex}>[{s.index}]</Text>
                    <Text style={styles.sourceTitle}>
                      {s.title} — {s.domain}
                    </Text>
                  </View>
                  {(s.sourceTypeLabel || s.trustScore !== null) && (
                    <Text style={styles.sourceMeta}>
                      {s.sourceTypeLabel ? `Type: ${s.sourceTypeLabel}` : ''}
                      {s.sourceTypeLabel && s.trustScore !== null ? ' | ' : ''}
                      {s.trustScore !== null
                        ? `Trust: ${s.trustScore}/100`
                        : ''}
                    </Text>
                  )}
                  {s.snippet && (
                    <Text style={styles.sourceSnippet}>
                      {s.snippet.length > 200
                        ? `${s.snippet.slice(0, 200)}…`
                        : s.snippet}
                    </Text>
                  )}
                  <Text style={styles.sourceUrl}>{s.url}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Footer (fixed, repeated on every page) ─────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.disclaimerText}>
            This document was generated by SwissTaxSearch. Content is based on
            AI-synthesised information from cited official sources and is
            intended for informational purposes only. Verify personal cases with
            the competent Swiss tax authority or a qualified adviser.
          </Text>
          <Text
            style={styles.pageNumberText}
            render={({
              pageNumber,
              totalPages
            }: {
              pageNumber: number
              totalPages: number
            }) => `Page ${pageNumber} of ${totalPages}  |  swisstaxsearch.ch`}
          />
        </View>
      </Page>
    </Document>
  )
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a PDF from `MessageExportData` and triggers a browser file download.
 *
 * Must be called in browser context only (event handler / useEffect).
 *
 * @param data     - Export data bundle from the `/api/messages/[id]/export-pdf` endpoint.
 * @param filename - Optional override for the downloaded file name.
 */
export async function generateAndDownloadPDF(
  data: MessageExportData,
  filename?: string
): Promise<void> {
  // Dynamic import of the pdf() helper — keeps @react-pdf/renderer out of SSR
  const { pdf } = await import('@react-pdf/renderer')

  const document = await buildPdfDocument(data)
  const blob = await pdf(document as any).toBlob()

  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = filename ?? buildFilename(data.messageId)
  window.document.body.appendChild(a)
  a.click()
  window.document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
