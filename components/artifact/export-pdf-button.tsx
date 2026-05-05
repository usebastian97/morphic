'use client'

/**
 * ExportPDFButton — icon button that triggers PDF export for an assistant message.
 *
 * Renders a "download" icon button with a Radix Tooltip.  While the PDF is
 * being generated, the icon is replaced with a spinning refresh icon.
 * Toast feedback is provided by the underlying useExportPdf hook.
 */

import { Icon } from '@iconify/react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { useExportPdf } from '@/lib/hooks/use-export-pdf'
import { cn } from '@/lib/utils'

import { Button } from '../ui/button'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExportPDFButtonProps {
  messageId: string
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Download-as-PDF button for a single assistant message.
 *
 * @param messageId - ID of the assistant `messages` row to export.
 * @param className - Additional Tailwind classes applied to the button.
 */
export function ExportPDFButton({
  messageId,
  className
}: ExportPDFButtonProps): React.JSX.Element {
  const { download, isLoading } = useExportPdf(messageId)

  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={download}
            disabled={isLoading}
            aria-label="Download as PDF"
            className={cn('rounded-full', className)}
          >
            {isLoading ? (
              <Icon
                icon="solar:refresh-bold"
                className="size-3.5 animate-spin"
              />
            ) : (
              <Icon
                icon="solar:file-download-bold"
                className="size-3.5"
              />
            )}
          </Button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={4}
            className="z-50 overflow-hidden rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {isLoading ? 'Generating PDF…' : 'Download as PDF'}
            <TooltipPrimitive.Arrow className="fill-popover" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
