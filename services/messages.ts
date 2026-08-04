/**
 * Messages service
 */

import { createClient } from '@/lib/supabase/server'
import type { MessageRow, ConversationRow } from '@/types/database'
import { ok, err, mapSupabaseError, mapUnknownError, type ServiceResult } from './errors'

export interface MessageWithSender extends MessageRow {
  sender: { id: string; name: string | null; avatar_url: string | null } | null
}

export interface ConversationWithPreview extends ConversationRow {
  order: {
    id: string
    image_url: string
    status: string
  } | null
  other_party: { id: string; name: string | null; avatar_url: string | null } | null
}

/**
 * Fetch messages for an order (newest last = chronological).
 */
export async function getMessagesByOrder(
  orderId: string,
  params: { limit?: number; before?: string } = {}
): Promise<ServiceResult<MessageWithSender[]>> {
  try {
    const supabase = createClient()
    const { limit = 50, before } = params

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id (id, name, avatar_url)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .limit(limit)

    // Cursor-based pagination: only messages before this timestamp
    if (before) query = query.lt('created_at', before)

    const { data, error } = await query

    if (error) return err(mapSupabaseError(error, 'getMessagesByOrder'))
    return ok((data ?? []) as MessageWithSender[])
  } catch (e) {
    return err(mapUnknownError(e, 'getMessagesByOrder'))
  }
}

/**
 * List conversations for the current user (inbox view), paginated.
 */
export async function getConversations(
  params: { page?: number; limit?: number } = {}
): Promise<ServiceResult<{ data: ConversationWithPreview[]; total: number }>> {
  try {
    const supabase = createClient()
    const { page = 1, limit = 20 } = params
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err({ code: 'UNAUTHORIZED', message: 'Not authenticated.' })

    const from = (page - 1) * limit
    const to   = from + limit - 1

    const { data, error, count } = await supabase
      .from('conversations')
      .select(`
        *,
        order:design_requests!order_id (id, image_url, status)
      `, { count: 'exact' })
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(from, to)

    if (error) return err(mapSupabaseError(error, 'getConversations'))

    // Attach other_party info: if current user is customer → get tailor, vice versa
    const rows = (data ?? []) as ConversationWithPreview[]
    const otherPartyIds = rows.map(c =>
      c.customer_id === user.id ? c.tailor_id : c.customer_id
    )

    let partyMap: Record<string, { id: string; name: string | null; avatar_url: string | null }> = {}
    if (otherPartyIds.length > 0) {
      const { data: parties } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .in('id', otherPartyIds)
      if (parties) {
        partyMap = Object.fromEntries(parties.map(p => [p.id, p]))
      }
    }

    const enriched = rows.map(c => ({
      ...c,
      other_party: partyMap[c.customer_id === user.id ? c.tailor_id : c.customer_id] ?? null
    }))

    return ok({ data: enriched, total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getConversations'))
  }
}

/**
 * Reset the unread count for the current user in a conversation.
 */
export async function markConversationRead(
  orderId: string,
  role: 'customer' | 'tailor'
): Promise<ServiceResult<void>> {
  try {
    const supabase = createClient()

    const field = role === 'customer' ? 'customer_unread' : 'tailor_unread'
    const { error } = await supabase
      .from('conversations')
      .update({ [field]: 0 })
      .eq('order_id', orderId)

    if (error) return err(mapSupabaseError(error, 'markConversationRead'))
    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'markConversationRead'))
  }
}
