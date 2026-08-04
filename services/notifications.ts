/**
 * Notifications service
 * All operations run under authenticated user's RLS context.
 */

import { createClient } from '@/lib/supabase/server'
import type { NotificationRow, NotificationType } from '@/types/database'
import { ok, err, mapSupabaseError, mapUnknownError, type ServiceResult } from './errors'

export interface NotificationListResult {
  data:        NotificationRow[]
  unread:      number
  total:       number
}

/**
 * Fetch the current user's notifications, newest first.
 */
export async function getNotifications(params: {
  limit?:   number
  page?:    number
  unread_only?: boolean
} = {}): Promise<ServiceResult<NotificationListResult>> {
  try {
    const supabase = createClient()
    const { limit = 50, page = 1, unread_only = false } = params
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (unread_only) query = query.eq('read', false)

    const { data, error, count } = await query

    if (error) return err(mapSupabaseError(error, 'getNotifications'))

    const rows = (data ?? []) as NotificationRow[]
    const unread = rows.filter(n => !n.read).length

    return ok({ data: rows, unread, total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getNotifications'))
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(
  notificationId: string
): Promise<ServiceResult<void>> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) return err(mapSupabaseError(error, 'markNotificationRead'))
    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'markNotificationRead'))
  }
}

/**
 * Mark all of the current user's notifications as read.
 */
export async function markAllNotificationsRead(): Promise<ServiceResult<void>> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)

    if (error) return err(mapSupabaseError(error, 'markAllNotificationsRead'))
    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'markAllNotificationsRead'))
  }
}

/**
 * Create a notification for a user (server-side only).
 * Components should never call this — use API routes or DB triggers.
 */
export async function createNotification(
  userId:           string,
  message:          string,
  link:             string | null = null,
  notificationType: NotificationType = 'system'
): Promise<ServiceResult<NotificationRow>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, message, link, read: false, notification_type: notificationType })
      .select()
      .single()

    if (error) return err(mapSupabaseError(error, 'createNotification'))
    return ok(data as NotificationRow)
  } catch (e) {
    return err(mapUnknownError(e, 'createNotification'))
  }
}
