'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Icon } from '@iconify/react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

import { Step1 } from './_steps/step-1'
import { Step2 } from './_steps/step-2'
import { Step3 } from './_steps/step-3'
import { Step4 } from './_steps/step-4'
import { Step5 } from './_steps/step-5'
import type { OnboardingData } from './_steps/types'

const TOTAL_STEPS = 5
const SUPPORTED_LANGUAGES = [
  'en',
  'es',
  'fr',
  'pt',
  'ar',
  'hi',
  'sw',
  'ro',
  'de',
  'it'
]

const initialData: OnboardingData = {
  farmTypes: [],
  primaryCrops: [],
  farmSizeInput: '',
  farmSizeUnit: 'hectares',
  farmSizeHa: null,
  countryCode: '',
  region: '',
  climateZone: '',
  preferredLanguage: 'en'
}

function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en'

  const language = navigator.language.split('-')[0]?.toLowerCase() ?? 'en'
  return SUPPORTED_LANGUAGES.includes(language) ? language : 'en'
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setData(current => ({
      ...current,
      preferredLanguage: getBrowserLanguage()
    }))
  }, [])

  useEffect(() => {
    let ignore = false

    async function redirectIfComplete() {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (ignore) return
      if (!user) {
        router.replace('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()

      if (!ignore && profile?.onboarding_completed) {
        router.replace('/chat')
      }
    }

    redirectIfComplete()

    return () => {
      ignore = true
    }
  }, [router])

  const activeStep = useMemo(() => {
    switch (step) {
      case 1:
        return <Step1 data={data} setData={setData} />
      case 2:
        return <Step2 data={data} setData={setData} />
      case 3:
        return <Step3 data={data} setData={setData} />
      case 4:
        return <Step4 data={data} setData={setData} />
      case 5:
      default:
        return <Step5 data={data} setData={setData} onEdit={setStep} />
    }
  }, [data, step])

  const validateCurrentStep = () => {
    if (step === 1 && data.farmTypes.length === 0) {
      setValidationMessage('Select at least one farm type to continue.')
      return false
    }

    if (step === 4 && !data.countryCode) {
      setValidationMessage('Select your country to continue.')
      return false
    }

    setValidationMessage(null)
    return true
  }

  const goNext = () => {
    if (!validateCurrentStep()) return
    setStep(current => Math.min(TOTAL_STEPS, current + 1))
  }

  const goBack = () => {
    setValidationMessage(null)
    setStep(current => Math.max(1, current - 1))
  }

  const finishOnboarding = async () => {
    if (!validateCurrentStep()) return

    const supabase = createClient()
    setIsSaving(true)

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('User is not authenticated')

      const { error } = await supabase
        .from('user_profiles')
        .update({
          farm_types: data.farmTypes,
          primary_crops: data.primaryCrops,
          farm_size_ha: data.farmSizeHa,
          country_code: data.countryCode,
          region: data.region.trim() || null,
          climate_zone: data.climateZone || null,
          preferred_language: data.preferredLanguage,
          onboarding_completed: true
        })
        .eq('id', user.id)

      if (error) throw error

      router.replace('/chat')
      router.refresh()
    } catch {
      toast.error('Something went wrong saving your profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center bg-background px-4 py-10">
      {/* Brand header */}
      <div className="mb-5 flex w-full max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg bg-emerald-700 p-1.5 text-white">
            <Icon icon="solar:leaf-bold" className="size-4" />
          </span>
          <span className="font-semibold">AgriEvidence</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {step} / {TOTAL_STEPS}
        </span>
      </div>

      {/* Step progress bar */}
      <div className="mb-5 flex w-full max-w-2xl gap-1.5" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map(
          stepNumber => (
            <div
              key={stepNumber}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                stepNumber <= step ? 'bg-emerald-700' : 'bg-muted-foreground/20'
              )}
            />
          )
        )}
      </div>

      {/* Step content — matches chat panel container */}
      <div className="relative flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-input bg-muted p-6 transition-shadow">
        {activeStep}

        {validationMessage && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {validationMessage}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-4 flex w-full max-w-2xl items-center justify-between px-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goBack}
          disabled={step === 1 || isSaving}
          className={cn('rounded-full gap-1.5', step === 1 && 'invisible')}
        >
          <Icon icon="solar:alt-arrow-left-bold" className="size-3.5" />
          Back
        </Button>

        {step < TOTAL_STEPS ? (
          <Button
            type="button"
            size="sm"
            onClick={goNext}
            className="rounded-full gap-1.5"
          >
            Continue
            <Icon icon="solar:alt-arrow-right-bold" className="size-3.5" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={finishOnboarding}
            disabled={isSaving}
            className="rounded-full gap-1.5"
          >
            {isSaving ? (
              <Icon
                icon="solar:refresh-bold"
                className="size-3.5 animate-spin"
              />
            ) : (
              <Icon icon="solar:magnifer-bold" className="size-3.5" />
            )}
            {isSaving ? 'Saving...' : 'Start searching'}
          </Button>
        )}
      </div>
    </div>
  )
}
