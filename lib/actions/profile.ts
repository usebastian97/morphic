'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import {
  getUserProfile,
  updateUserProfile
} from '@/lib/supabase/queries/user-profile'
import { createClient } from '@/lib/supabase/server'
import type {
  CantonCode,
  PreferredLanguage,
  TaxpayerType,
  UserProfile
} from '@/lib/supabase/types'

export async function getProfileAction(): Promise<UserProfile | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const supabase = await createClient()
  return getUserProfile(supabase, userId)
}

export type ProfileUpdatePayload = {
  fullName: string
  bio: string
  cantonCode: CantonCode | ''
  municipality: string
  taxpayerType: TaxpayerType
  preferredLanguage: PreferredLanguage
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
      cantonCode: payload.cantonCode || null,
      municipality: payload.municipality.trim() || null,
      taxpayerType: payload.taxpayerType,
      preferredLanguage: payload.preferredLanguage
    })

    revalidatePath('/profile')
    return { success: true }
  } catch (err) {
    console.error('updateProfileAction error:', err)
    return { success: false, error: 'Failed to update profile' }
  }
}
