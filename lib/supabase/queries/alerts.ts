import type { SupabaseClient } from '@supabase/supabase-js'

import {
  type AlertChannel,
  type AlertFrequency,
  type AlertSubscription,
  type AlertType,
  mapAlertSubscriptionRow
} from '../types'

type DB = SupabaseClient

// ---------------------------------------------------------------
// Read
// ---------------------------------------------------------------

export async function getUserAlerts(
  db: DB,
  userId: string
): Promise<AlertSubscription[]> {
  const { data, error } = await db
    .from('tax_alert_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapAlertSubscriptionRow)
}

// ---------------------------------------------------------------
// Create
// ---------------------------------------------------------------

export async function createAlert(
  db: DB,
  userId: string,
  input: {
    name: string
    alertType: AlertType
    taxTopicId?: string
    keywords?: string[]
    cantonCodes?: string[]
    channels?: AlertChannel[]
    frequency?: AlertFrequency
    webhookUrl?: string
  }
): Promise<AlertSubscription> {
  const { data, error } = await db
    .from('tax_alert_subscriptions')
    .insert({
      user_id: userId,
      name: input.name,
      alert_type: input.alertType,
      tax_topic_id: input.taxTopicId ?? null,
      keywords: input.keywords ?? [],
      canton_codes: input.cantonCodes ?? [],
      channels: input.channels ?? ['email'],
      frequency: input.frequency ?? 'daily',
      webhook_url: input.webhookUrl ?? null
    })
    .select()
    .single()

  if (error) throw error
  return mapAlertSubscriptionRow(data)
}

// ---------------------------------------------------------------
// Update
// ---------------------------------------------------------------

export async function updateAlert(
  db: DB,
  alertId: string,
  updates: Partial<
    Pick<
      AlertSubscription,
      | 'name'
      | 'keywords'
      | 'cantonCodes'
      | 'channels'
      | 'frequency'
      | 'webhookUrl'
      | 'isActive'
    >
  >
): Promise<AlertSubscription> {
  const row: Record<string, unknown> = {}
  if (updates.name !== undefined) row.name = updates.name
  if (updates.keywords !== undefined) row.keywords = updates.keywords
  if (updates.cantonCodes !== undefined) row.canton_codes = updates.cantonCodes
  if (updates.channels !== undefined) row.channels = updates.channels
  if (updates.frequency !== undefined) row.frequency = updates.frequency
  if (updates.webhookUrl !== undefined) row.webhook_url = updates.webhookUrl
  if (updates.isActive !== undefined) row.is_active = updates.isActive

  const { data, error } = await db
    .from('tax_alert_subscriptions')
    .update(row)
    .eq('id', alertId)
    .select()
    .single()

  if (error) throw error
  return mapAlertSubscriptionRow(data)
}

// ---------------------------------------------------------------
// Delete
// ---------------------------------------------------------------

export async function deleteAlert(db: DB, alertId: string): Promise<void> {
  const { error } = await db
    .from('tax_alert_subscriptions')
    .delete()
    .eq('id', alertId)

  if (error) throw error
}
