/**
 * EvidenceScoreBadge — compact inline badge shown below each assistant message.
 *
 * Fetches the evidence score from /api/messages/[messageId]/evidence-score,
 * polling every 2 seconds for up to 10 seconds if the score is not yet
 * computed.  Hides itself if no score arrives within the timeout.
 *
 * On hover it expands a Radix UI HoverCard showing the full breakdown:
 * federal count, cantonal count, municipal count, average official trust
 * score, and a non-official warning when applicable.
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Icon } from '@iconify/react'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'

import type { EvidenceScore } from '@/lib/swiss-tax/official-source-score'
import { getScoreColor } from '@/lib/swiss-tax/official-source-score'
import { cn } from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EvidenceScoreBadgeProps {
  messageId: string
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2000
const MAX_POLL_DURATION_MS = 10000

// ─── Icon mapping ─────────────────────────────────────────────────────────────

function getShieldIcon(label: EvidenceScore['label']): string {
  switch (label) {
    case 'High':
      return 'solar:shield-check-bold'
    case 'Moderate':
      return 'solar:shield-warning-bold'
    case 'Low':
      return 'solar:shield-cross-bold'
    case 'Insufficient':
      return 'solar:shield-bold'
  }
}

// ─── Color classes derived from getScoreColor ─────────────────────────────────

type ColorFamily = ReturnType<typeof getScoreColor>

function colorClasses(family: ColorFamily) {
  const map: Record<
    ColorFamily,
    { dot: string; text: string; iconText: string; border: string; bg: string }
  > = {
    green: {
      dot: 'bg-green-500 dark:bg-green-400',
      text: 'text-green-700 dark:text-green-400',
      iconText: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      bg: 'bg-green-50 dark:bg-green-950/40'
    },
    amber: {
      dot: 'bg-amber-500 dark:bg-amber-400',
      text: 'text-amber-700 dark:text-amber-400',
      iconText: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      bg: 'bg-amber-50 dark:bg-amber-950/40'
    },
    orange: {
      dot: 'bg-orange-500 dark:bg-orange-400',
      text: 'text-orange-700 dark:text-orange-400',
      iconText: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      bg: 'bg-orange-50 dark:bg-orange-950/40'
    },
    red: {
      dot: 'bg-red-500 dark:bg-red-400',
      text: 'text-red-700 dark:text-red-400',
      iconText: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      bg: 'bg-red-50 dark:bg-red-950/40'
    }
  }
  return map[family]
}

// ─── Custom hook ──────────────────────────────────────────────────────────────

interface UseEvidenceScoreResult {
  score: EvidenceScore | null
  isLoading: boolean
}

function useEvidenceScore(messageId: string): UseEvidenceScoreResult {
  const [score, setScore] = useState<EvidenceScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hidden, setHidden] = useState(false)

  const startTimeRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchScore = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/messages/${encodeURIComponent(messageId)}/evidence-score`,
        { cache: 'no-store' }
      )

      if (res.status === 404) {
        // Message not found / RLS denied — stop polling, hide
        setIsLoading(false)
        setHidden(true)
        return true // done
      }

      if (!res.ok) {
        // Transient error — keep polling
        return false
      }

      const json = (await res.json()) as { score: EvidenceScore | null }

      if (json.score !== null) {
        setScore(json.score)
        setIsLoading(false)
        return true // done
      }

      // Score not yet computed — check timeout
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now())
      if (elapsed >= MAX_POLL_DURATION_MS) {
        setIsLoading(false)
        setHidden(true)
        return true // timed out
      }

      return false // keep polling
    } catch {
      // Network error — keep polling unless timed out
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now())
      if (elapsed >= MAX_POLL_DURATION_MS) {
        setIsLoading(false)
        setHidden(true)
        return true
      }
      return false
    }
  }, [messageId])

  useEffect(() => {
    startTimeRef.current = Date.now()

    const poll = async () => {
      const done = await fetchScore()
      if (!done) {
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    // Start after a brief initial delay so the stream has time to finish
    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [fetchScore])

  if (hidden) {
    return { score: null, isLoading: false }
  }

  return { score, isLoading }
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function EvidenceScoreSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 h-5 w-32 rounded-full animate-pulse bg-muted',
        className
      )}
    />
  )
}

// ─── Breakdown row ────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  value
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="flex justify-between items-center gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EvidenceScoreBadge({
  messageId,
  className
}: EvidenceScoreBadgeProps) {
  const { score, isLoading } = useEvidenceScore(messageId)

  if (isLoading) {
    return <EvidenceScoreSkeleton className={className} />
  }

  if (!score) {
    return null
  }

  const family = getScoreColor(score.label)
  const colors = colorClasses(family)
  const icon = getShieldIcon(score.label)
  const { breakdown } = score

  return (
    <HoverCardPrimitive.Root openDelay={200} closeDelay={100}>
      <HoverCardPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`Evidence score: ${score.label} based on ${breakdown.total_sources} sources`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5',
            'text-xs font-medium border cursor-default select-none',
            'transition-colors duration-150',
            colors.bg,
            colors.border,
            colors.text,
            className
          )}
        >
          <Icon icon={icon} className={cn('size-3.5', colors.iconText)} />
          <span>{score.label}</span>
          <span className="opacity-60">·</span>
          <span className="opacity-80">{breakdown.total_sources} sources</span>
        </button>
      </HoverCardPrimitive.Trigger>

      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side="top"
          align="start"
          sideOffset={6}
          className={cn(
            'z-50 w-64 rounded-lg border bg-popover p-3 shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=top]:slide-in-from-bottom-2'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Icon icon={icon} className={cn('size-4', colors.iconText)} />
            <div>
              <p
                className={cn(
                  'text-sm font-semibold leading-none',
                  colors.text
                )}
              >
                Evidence Score: {score.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overall: {score.overall}/100
              </p>
            </div>
          </div>

          {/* Score bar */}
          <div className="mb-3">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', colors.dot)}
                style={{ width: `${score.overall}%` }}
              />
            </div>
          </div>

          {/* Source breakdown */}
          <div className="space-y-1.5 text-xs">
            <p className="font-medium text-foreground mb-1">Source breakdown</p>
            <BreakdownRow label="Federal" value={breakdown.federal_count} />
            <BreakdownRow label="Cantonal" value={breakdown.cantonal_count} />
            <BreakdownRow label="Municipal" value={breakdown.municipal_count} />
            <BreakdownRow
              label="Legal / forms / news"
              value={
                breakdown.legal_or_form_count + breakdown.official_news_count
              }
            />
            <BreakdownRow
              label="Non-official"
              value={breakdown.non_official_count}
            />
            {breakdown.avg_official_trust !== null && (
              <BreakdownRow
                label="Avg. official trust"
                value={`${breakdown.avg_official_trust}/100`}
              />
            )}
          </div>

          {/* Fallback warning */}
          {breakdown.used_non_official_results && (
            <div className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-1.5">
              <Icon
                icon="solar:danger-triangle-bold"
                className="size-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
                Non-official results were detected. Treat this answer as lower
                confidence until an official source confirms it.
              </p>
            </div>
          )}

          <HoverCardPrimitive.Arrow className="fill-border" />
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  )
}
