import type { UserProfile } from '@/lib/supabase/types'

function valueOrFallback(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : 'Not specified'
}

export function buildUserTaxContextBlock(
  profile: UserProfile | null | undefined
): string | null {
  if (!profile) return null

  return `User Swiss tax context:
- Canton: ${valueOrFallback(profile.cantonCode)}
- Municipality: ${valueOrFallback(profile.municipality)}
- Taxpayer type: ${profile.taxpayerType}
- Preferred language: ${profile.preferredLanguage}

When answering, prioritize official federal, cantonal, and municipal guidance that matches this user's canton and taxpayer type. If the official source is federal-only or canton-specific, say so explicitly.`
}

export function buildQueryEnricherUserContext(
  profile: UserProfile | null | undefined
): string | null {
  if (!profile) return null

  const details = [
    profile.cantonCode ? `canton: ${profile.cantonCode}` : null,
    profile.municipality ? `municipality: ${profile.municipality}` : null,
    profile.taxpayerType ? `taxpayer type: ${profile.taxpayerType}` : null,
    profile.preferredLanguage
      ? `preferred language: ${profile.preferredLanguage}`
      : null
  ].filter((detail): detail is string => Boolean(detail))

  return details.length > 0 ? details.join('; ') : null
}
