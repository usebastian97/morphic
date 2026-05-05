'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'
import {
  getUserProfile,
  updateUserProfile
} from '@/lib/supabase/queries/user-profile'
import type { ClimateZone, FarmType, UserProfile } from '@/lib/supabase/types'

export async function getProfileAction(): Promise<UserProfile | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const supabase = await createClient()
  return getUserProfile(supabase, userId)
}

export type ProfileUpdatePayload = {
  fullName: string
  bio: string
  farmTypes: FarmType[]
  primaryCrops: string[]
  farmSizeHa: number | null
  countryCode: string
  region: string
  climateZone: ClimateZone | ''
  preferredLanguage: string
}

export async function updateProfileAction(
  payload: ProfileUpdatePayload
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  const supabase = await createClient()

  try {
    await updateUserProfile(supabase, userId, {
      fullName: payload.fullName.trim() || null,
      bio: payload.bio.trim() || null,
      farmTypes: payload.farmTypes,
      primaryCrops: payload.primaryCrops,
      farmSizeHa: payload.farmSizeHa,
      countryCode: payload.countryCode || null,
      region: payload.region.trim() || null,
      climateZone: payload.climateZone || null
    })

    revalidatePath('/profile')
    return { success: true }
  } catch (err) {
    console.error('updateProfileAction error:', err)
    return { success: false, error: 'Failed to update profile' }
  }
}
