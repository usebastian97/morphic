'use client'

import { Textarea } from '@/components/ui/textarea'

import type { StepProps } from './types'

export function Step3({ data, setData }: StepProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          Any tax research focus?
        </h1>
        <p className="text-muted-foreground">
          Add optional context such as VAT, source tax, deductions, deadlines,
          corporate tax, or official tax news.
        </p>
      </div>

      <Textarea
        value={data.bio}
        rows={5}
        placeholder="Example: I mostly research Zurich individual deductions and federal VAT changes."
        onChange={event =>
          setData(current => ({ ...current, bio: event.target.value }))
        }
        className="resize-none"
      />
    </section>
  )
}
