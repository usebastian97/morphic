'use client'

import type { CantonCode } from '@/lib/supabase/types'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { CANTON_LABELS, type StepProps } from './types'

const CANTON_OPTIONS = Object.entries(CANTON_LABELS) as [CantonCode, string][]

export function Step2({ data, setData }: StepProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          Which Swiss jurisdiction matters most?
        </h1>
        <p className="text-muted-foreground">
          Swiss tax rules often differ by canton and sometimes by municipality.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="canton">Canton</Label>
          <select
            id="canton"
            value={data.cantonCode}
            onChange={event =>
              setData(current => ({
                ...current,
                cantonCode: event.target.value as CantonCode
              }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select canton</option>
            {CANTON_OPTIONS.map(([code, label]) => (
              <option key={code} value={code}>
                {code} - {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="municipality">Municipality</Label>
          <Input
            id="municipality"
            placeholder="e.g. Zurich, Lausanne, Lugano"
            value={data.municipality}
            onChange={event =>
              setData(current => ({
                ...current,
                municipality: event.target.value
              }))
            }
          />
        </div>
      </div>
    </section>
  )
}
