import type { SupabaseClient } from '@supabase/supabase-js'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  type CreditOperation,
  mapSubscriptionRow,
  type Subscription
} from '@/lib/supabase/types'
import type { SearchMode } from '@/lib/types/search'

export type SearchCreditCharge = {
  amount: number
  operation: Extract<CreditOperation, 'speed_search' | 'quality_search'>
  label: 'Speed search' | 'Quality search'
}

export type CreditBalance = {
  subscription: Subscription
  totalBalance: number
}

export function getSearchCreditCharge(
  searchMode: SearchMode | undefined
): SearchCreditCharge {
  if (searchMode === 'quick') {
    return {
      amount: 1,
      operation: 'speed_search',
      label: 'Speed search'
    }
  }

  return {
    amount: 4,
    operation: 'quality_search',
    label: 'Quality search'
  }
}

export async function getCreditBalance(
  db: SupabaseClient,
  userId: string
): Promise<CreditBalance | null> {
  const { data, error } = await db
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const subscription = mapSubscriptionRow(data)
  return {
    subscription,
    totalBalance:
      subscription.creditsBalance +
      subscription.rolloverCredits +
      subscription.topupCredits
  }
}

export async function createCreditLimitResponse({
  db,
  userId,
  charge
}: {
  db: SupabaseClient
  userId: string
  charge: SearchCreditCharge
}): Promise<Response | null> {
  const balance = await getCreditBalance(db, userId)

  if (!balance) {
    return Response.json(
      {
        error: 'No subscription record found. Please refresh your account.',
        code: 'no_subscription',
        requiredCredits: charge.amount
      },
      { status: 402 }
    )
  }

  if (balance.subscription.polarStatus !== 'active') {
    return Response.json(
      {
        error: 'Your subscription is not active.',
        code: 'subscription_inactive',
        status: balance.subscription.polarStatus
      },
      { status: 402 }
    )
  }

  if (balance.totalBalance < charge.amount) {
    return Response.json(
      {
        error: 'You do not have enough credits for this search.',
        code: 'insufficient_credits',
        requiredCredits: charge.amount,
        availableCredits: balance.totalBalance,
        searchType: charge.label
      },
      { status: 402 }
    )
  }

  return null
}

export async function deductCreditsAfterSuccess({
  userId,
  charge,
  chatId,
  messageId
}: {
  userId: string
  charge: SearchCreditCharge
  chatId: string
  messageId: string
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: charge.amount,
      p_operation: charge.operation,
      p_chat_id: chatId,
      p_message_id: messageId
    })

    if (error) {
      console.error('[Credits] Failed to deduct credits:', error)
      return
    }

    const result = data as {
      ok?: boolean
      error?: string
      balance_after?: number
    }
    if (!result?.ok) {
      console.warn('[Credits] Deduction skipped:', result)
    }
  } catch (error) {
    console.error('[Credits] Unexpected deduction error:', error)
  }
}
