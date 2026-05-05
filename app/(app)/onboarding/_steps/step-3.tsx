'use client'

import { cn } from '@/lib/utils'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { FarmSizeUnit, StepProps } from './types'

const ACRE_TO_HECTARE = 0.404686

function formatFarmSize(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3)
}

function toHectares(value: number, unit: FarmSizeUnit): number {
  return unit === 'acres' ? value * ACRE_TO_HECTARE : value
}

export function Step3({ data, setData }: StepProps) {
  const updateValue = (
    value: string,
    unit: FarmSizeUnit = data.farmSizeUnit
  ) => {
    const parsedValue = Number(value)

    setData(current => ({
      ...current,
      farmSizeInput: value,
      farmSizeHa:
        value.trim() === '' || Number.isNaN(parsedValue)
          ? null
          : toHectares(parsedValue, unit)
    }))
  }

  const updateUnit = (nextUnit: FarmSizeUnit) => {
    if (nextUnit === data.farmSizeUnit) return

    const parsedValue = Number(data.farmSizeInput)
    const nextInput =
      data.farmSizeInput.trim() === '' || Number.isNaN(parsedValue)
        ? data.farmSizeInput
        : nextUnit === 'acres'
          ? formatFarmSize(parsedValue / ACRE_TO_HECTARE)
          : formatFarmSize(parsedValue * ACRE_TO_HECTARE)

    setData(current => ({
      ...current,
      farmSizeUnit: nextUnit,
      farmSizeInput: nextInput,
      farmSizeHa:
        nextInput.trim() === '' || Number.isNaN(Number(nextInput))
          ? null
          : toHectares(Number(nextInput), nextUnit)
    }))
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          How large is your farm or operation?
        </h1>
        <p className="text-muted-foreground">
          Farm size helps us calibrate recommendations between smallholder and
          commercial scale.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <Label htmlFor="farm-size">Size</Label>
          <Input
            id="farm-size"
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 50"
            value={data.farmSizeInput}
            onChange={event => updateValue(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>Unit</Label>
          <div className="flex gap-1.5 rounded-full border border-input bg-background p-1 w-fit">
            {(['hectares', 'acres'] as FarmSizeUnit[]).map(unit => (
              <button
                key={unit}
                type="button"
                onClick={() => updateUnit(unit)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  data.farmSizeUnit === unit
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {unit === 'hectares' ? 'Hectares' : 'Acres'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Farm size helps calibrate recommendations between smallholder and
        commercial scale. Values are stored in hectares for consistency.
      </p>
    </section>
  )
}
