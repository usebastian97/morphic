'use client'

import type { PreferredLanguage } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

import { LANGUAGE_LABELS, type StepProps } from './types'

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS) as [
  PreferredLanguage,
  string
][]

export function Step4({ data, setData }: StepProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          Choose your preferred language.
        </h1>
        <p className="text-muted-foreground">
          SwissTaxSearch will respond in your language and search official
          multilingual tax terms where useful.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {LANGUAGE_OPTIONS.map(([code, label]) => {
          const selected = data.preferredLanguage === code
          return (
            <button
              key={code}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                setData(current => ({ ...current, preferredLanguage: code }))
              }
              className={cn(
                'rounded-2xl border bg-background px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-red-700 bg-red-700/10 ring-1 ring-red-700/20'
                  : 'border-input hover:border-muted-foreground/40'
              )}
            >
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-sm uppercase text-muted-foreground">
                {code}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
