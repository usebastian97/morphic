'use client'

import { Icon } from '@iconify/react'

import type { TaxpayerType } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

import type { StepProps } from './types'

const TAXPAYER_TYPE_OPTIONS: {
  value: TaxpayerType
  label: string
  description: string
  icon: string
}[] = [
  {
    value: 'individual',
    label: 'Individual',
    description: 'Personal income, wealth, deductions, and deadlines',
    icon: 'solar:user-rounded-bold'
  },
  {
    value: 'self_employed',
    label: 'Self-employed',
    description: 'Business income, expenses, social security, and VAT checks',
    icon: 'solar:case-bold'
  },
  {
    value: 'business',
    label: 'Business',
    description: 'Corporate tax, VAT, withholding tax, and filings',
    icon: 'solar:buildings-bold'
  },
  {
    value: 'expat',
    label: 'Expat',
    description: 'Residency, source tax, relocation, and double taxation',
    icon: 'solar:global-bold'
  },
  {
    value: 'advisor',
    label: 'Advisor',
    description: 'Research support for tax professionals and fiduciaries',
    icon: 'solar:documents-bold'
  },
  {
    value: 'institution',
    label: 'Institution',
    description: 'Official updates, policy tracking, and source monitoring',
    icon: 'solar:banknote-bold'
  }
]

export function Step1({ data, setData }: StepProps) {
  const selectTaxpayerType = (taxpayerType: TaxpayerType) => {
    setData(current => ({ ...current, taxpayerType }))
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          What tax context should SwissTaxSearch prioritize?
        </h1>
        <p className="text-muted-foreground">
          This helps the assistant emphasize the right official federal,
          cantonal, and municipal sources.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {TAXPAYER_TYPE_OPTIONS.map(option => {
          const selected = data.taxpayerType === option.value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => selectTaxpayerType(option.value)}
              className={cn(
                'rounded-2xl border bg-background p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-red-700 bg-red-700/10 ring-1 ring-red-700/20'
                  : 'border-input hover:border-muted-foreground/40'
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 rounded-xl p-2',
                    selected
                      ? 'bg-red-700 text-white'
                      : 'bg-muted text-red-700 dark:text-red-400'
                  )}
                >
                  <Icon icon={option.icon} className="size-5" />
                </span>
                <span className="space-y-1">
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
