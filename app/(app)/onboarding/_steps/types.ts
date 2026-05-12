import type { Dispatch, SetStateAction } from 'react'

import type {
  CantonCode,
  PreferredLanguage,
  TaxpayerType
} from '@/lib/supabase/types'

export type OnboardingData = {
  taxpayerType: TaxpayerType
  cantonCode: CantonCode | ''
  municipality: string
  preferredLanguage: PreferredLanguage
  bio: string
}

export type StepProps = {
  data: OnboardingData
  setData: Dispatch<SetStateAction<OnboardingData>>
}

export const TAXPAYER_TYPE_LABELS: Record<TaxpayerType, string> = {
  individual: 'Individual',
  self_employed: 'Self-employed',
  business: 'Business',
  expat: 'Expat',
  advisor: 'Advisor',
  institution: 'Institution'
}

export const LANGUAGE_LABELS: Record<PreferredLanguage, string> = {
  de: 'German',
  fr: 'French',
  it: 'Italian',
  en: 'English'
}

export const CANTON_LABELS: Record<CantonCode, string> = {
  AG: 'Aargau',
  AI: 'Appenzell Innerrhoden',
  AR: 'Appenzell Ausserrhoden',
  BE: 'Bern',
  BL: 'Basel-Landschaft',
  BS: 'Basel-Stadt',
  FR: 'Fribourg',
  GE: 'Geneva',
  GL: 'Glarus',
  GR: 'Graubuenden',
  JU: 'Jura',
  LU: 'Lucerne',
  NE: 'Neuchatel',
  NW: 'Nidwalden',
  OW: 'Obwalden',
  SG: 'St. Gallen',
  SH: 'Schaffhausen',
  SO: 'Solothurn',
  SZ: 'Schwyz',
  TG: 'Thurgau',
  TI: 'Ticino',
  UR: 'Uri',
  VD: 'Vaud',
  VS: 'Valais',
  ZG: 'Zug',
  ZH: 'Zurich'
}
