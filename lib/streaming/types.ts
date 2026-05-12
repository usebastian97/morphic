import { UIMessage } from '@ai-sdk/react'

import type { SearchCreditCharge } from '../subscriptions/credits'
import type { UserProfile } from '../supabase/types'
import { Model } from '../types/models'
import { SearchMode } from '../types/search'

export interface BaseStreamConfig {
  message: UIMessage | null
  model: Model
  chatId: string
  userId: string
  trigger?: 'submit-user-message' | 'regenerate-assistant-message'
  messageId?: string
  abortSignal?: AbortSignal
  isNewChat?: boolean
  searchMode?: SearchMode
  userProfile?: UserProfile | null
  creditCharge?: SearchCreditCharge | null
}
