'use client'

import { Button } from '@/components/ui/button'

import {
  CANTON_LABELS,
  LANGUAGE_LABELS,
  type StepProps,
  TAXPAYER_TYPE_LABELS
} from './types'

type Step5Props = StepProps & {
  onEdit: (step: number) => void
}

function SummaryRow({
  label,
  value,
  step,
  onEdit
}: {
  label: string
  value: string
  step: number
  onEdit: (step: number) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="break-words text-sm text-muted-foreground">{value}</p>
      </div>
      <Button
        type="button"
        variant="link"
        className="h-auto shrink-0 p-0 text-red-700"
        onClick={() => onEdit(step)}
      >
        Edit
      </Button>
    </div>
  )
}

export function Step5({ data, onEdit }: Step5Props) {
  const summary = [
    {
      label: 'Taxpayer type',
      value: TAXPAYER_TYPE_LABELS[data.taxpayerType],
      step: 1
    },
    {
      label: 'Canton',
      value: data.cantonCode
        ? `${data.cantonCode} - ${CANTON_LABELS[data.cantonCode]}`
        : 'Not provided',
      step: 2
    },
    {
      label: 'Municipality',
      value: data.municipality.trim() || 'Not provided',
      step: 2
    },
    {
      label: 'Research focus',
      value: data.bio.trim() || 'Not provided',
      step: 3
    },
    {
      label: 'Preferred language',
      value: LANGUAGE_LABELS[data.preferredLanguage],
      step: 4
    }
  ]

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          Ready for official Swiss tax search.
        </h1>
        <p className="text-muted-foreground">
          Review the context SwissTaxSearch will use to prioritize official tax
          sources.
        </p>
      </div>

      <div className="rounded-2xl border border-input bg-background">
        <div className="border-b border-input px-4 pb-3 pt-4">
          <p className="text-sm font-medium">Your profile summary</p>
        </div>
        <div className="px-4 py-1">
          {summary.map(item => (
            <SummaryRow
              key={item.label}
              label={item.label}
              value={item.value}
              step={item.step}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
