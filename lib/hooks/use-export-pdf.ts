'use client'

/**
 * useExportPdf — hook that orchestrates fetching export data, generating the
 * PDF, showing toast feedback, and firing an analytics event.
 *
 * Usage:
 *   const { download, isLoading } = useExportPdf(messageId)
 *   <button onClick={download}>Download PDF</button>
 */

import { useCallback, useState } from 'react'

import { track } from '@vercel/analytics'
import { toast } from 'sonner'

import { generateAndDownloadPDF } from '@/lib/export/generate-pdf'
import type { MessageExportData } from '@/lib/supabase/queries/export-message'

interface UseExportPdfResult {
  /** Initiates the fetch → generate → download flow. */
  download: () => Promise<void>
  /** True while the download is in-progress. */
  isLoading: boolean
}

/**
 * Hook for downloading a cited PDF of an assistant message.
 *
 * @param messageId - ID of the assistant `messages` row to export.
 */
export function useExportPdf(messageId: string): UseExportPdfResult {
  const [isLoading, setIsLoading] = useState(false)

  const download = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const res = await fetch(
        `/api/messages/${encodeURIComponent(messageId)}/export-pdf`,
        { cache: 'no-store' }
      )

      if (res.status === 404) {
        toast.error('Response not found. PDF export is only available for saved messages.')
        return
      }

      if (!res.ok) {
        toast.error('Failed to generate PDF. Please try again.')
        return
      }

      const json = (await res.json()) as { data: MessageExportData }

      await generateAndDownloadPDF(json.data)

      toast.success('PDF downloaded successfully.')

      // Analytics — fire-and-forget, errors swallowed
      try {
        track('pdf_export', {
          messageId,
          label: json.data.evidenceScore?.label ?? 'none'
        })
      } catch {
        // analytics must not break the feature
      }
    } catch (err) {
      console.error('[useExportPdf] Error:', {
        messageId,
        error: err instanceof Error ? err.message : String(err)
      })
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [messageId, isLoading])

  return { download, isLoading }
}
