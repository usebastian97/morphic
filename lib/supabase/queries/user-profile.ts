import type { SupabaseClient } from '@supabase/supabase-js'

import { mapUserProfileRow, type UserProfile } from '../types'

type DB = SupabaseClient

// ---------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------

export async function getUserProfile(
  db: DB,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await db
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return mapUserProfileRow(data)
}

// ---------------------------------------------------------------
// Update
// ---------------------------------------------------------------

export async function updateUserProfile(
  db: DB,
  userId: string,
  updates: Partial<
    Pick<
      UserProfile,
      | 'fullName'
      | 'avatarUrl'
      | 'bio'
      | 'cantonCode'
      | 'municipality'
      | 'taxpayerType'
      | 'preferredLanguage'
      | 'onboardingCompleted'
    >
  >
): Promise<UserProfile> {
  const row: Record<string, unknown> = {}

  if (updates.fullName !== undefined) row.full_name = updates.fullName
  if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl
  if (updates.bio !== undefined) row.bio = updates.bio
  if (updates.cantonCode !== undefined) row.canton_code = updates.cantonCode
  if (updates.municipality !== undefined)
    row.municipality = updates.municipality
  if (updates.taxpayerType !== undefined)
    row.taxpayer_type = updates.taxpayerType
  if (updates.preferredLanguage !== undefined)
    row.preferred_language = updates.preferredLanguage
  if (updates.onboardingCompleted !== undefined)
    row.onboarding_completed = updates.onboardingCompleted

  const { data, error } = await db
    .from('user_profiles')
    .update(row)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return mapUserProfileRow(data)
}

// ---------------------------------------------------------------
// Touch last_seen_at
// ---------------------------------------------------------------

export async function touchUserActivity(db: DB, userId: string): Promise<void> {
  const { error } = await db
    .from('user_profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw error
}
