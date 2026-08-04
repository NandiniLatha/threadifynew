/**
 * Orders service
 * Uses: server-side Supabase client (anon key + RLS)
 * All writes validated against RLS — no service-role key exposed here.
 */

import { createClient } from '@/lib/supabase/server'
import type { DesignRequestRow, RequestStatus, OrderStatusHistoryRow } from '@/types/database'
import { ok, err, mapSupabaseError, mapUnknownError, type ServiceResult } from './errors'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrderListItem {
  id:          string
  status:      RequestStatus
  image_url:   string
  ai_tags:     unknown
  budget_min:  number
  budget_max:  number
  deadline:    string
  notes:       string | null
  amount_paid: number | null
  created_at:  string
  updated_at:  string
  tailor: {
    id:   string
    name: string | null
  } | null
  accepted_quotation: {
    id:             string
    price:          number
    estimated_days: number
  } | null
}

export interface OrderDetail extends DesignRequestRow {
  tailor: {
    id:   string
    name: string | null
  } | null
  quotations: Array<{
    id:             string
    tailor_id:      string
    price:          number
    estimated_days: number
    note:           string | null
    bid_status:     string
    created_at:     string
    tailor: { id: string; name: string | null } | null
  }>
  messages: Array<{
    id:             string
    sender_id:      string
    content:        string
    attachment_url: string | null
    created_at:     string
    sender: { id: string; name: string | null } | null
  }>
  status_history: OrderStatusHistoryRow[]
  review: { id: string; rating: number; comment: string | null } | null
}

export interface PaginationParams {
  page?:  number  // 1-indexed
  limit?: number  // default 20
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * List orders for the authenticated customer, paginated.
 * Tailors use getAssignedOrders().
 */
export async function getCustomerOrders(
  params: PaginationParams & { status?: RequestStatus } = {}
): Promise<ServiceResult<{ data: OrderListItem[]; total: number }>> {
  try {
    const supabase = createClient()
    const { page = 1, limit = 20, status } = params
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = supabase
      .from('design_requests')
      .select(`
        id, status, image_url, ai_tags, budget_min, budget_max,
        deadline, notes, amount_paid, created_at, updated_at,
        tailor:users!tailor_id (id, name),
        accepted_quotation:quotations!accepted_quotation_id (id, price, estimated_days)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query

    if (error) return err(mapSupabaseError(error, 'getCustomerOrders'))
    return ok({ data: (data as unknown as OrderListItem[]) ?? [], total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getCustomerOrders'))
  }
}

/**
 * List orders assigned to the authenticated tailor, paginated.
 */
export async function getAssignedOrders(
  params: PaginationParams & { status?: RequestStatus } = {}
): Promise<ServiceResult<{ data: OrderListItem[]; total: number }>> {
  try {
    const supabase = createClient()
    const { page = 1, limit = 20, status } = params
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = supabase
      .from('design_requests')
      .select(`
        id, status, image_url, ai_tags, budget_min, budget_max,
        deadline, notes, amount_paid, created_at, updated_at,
        tailor:users!tailor_id (id, name),
        accepted_quotation:quotations!accepted_quotation_id (id, price, estimated_days)
      `, { count: 'exact' })
      .not('tailor_id', 'is', null)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query

    if (error) return err(mapSupabaseError(error, 'getAssignedOrders'))
    return ok({ data: (data as unknown as OrderListItem[]) ?? [], total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getAssignedOrders'))
  }
}

/**
 * Get a single order with all related data.
 */
export async function getOrderById(id: string): Promise<ServiceResult<OrderDetail>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('design_requests')
      .select(`
        *,
        tailor:users!tailor_id (id, name),
        quotations (
          id, tailor_id, price, estimated_days, note, bid_status, created_at,
          tailor:users!tailor_id (id, name)
        ),
        messages (
          id, sender_id, content, attachment_url, created_at,
          sender:users!sender_id (id, name)
        ),
        status_history:order_status_history (
          id, from_status, to_status, changed_by, note, created_at
        ),
        review:reviews (id, rating, comment)
      `)
      .eq('id', id)
      .order('created_at', { referencedTable: 'messages',       ascending: true })
      .order('created_at', { referencedTable: 'status_history', ascending: true })
      .single()

    if (error) return err(mapSupabaseError(error, `getOrderById(${id})`))
    if (!data)  return err({ code: 'NOT_FOUND', message: 'Order not found.' })

    return ok(data as OrderDetail)
  } catch (e) {
    return err(mapUnknownError(e, 'getOrderById'))
  }
}

/**
 * Get open design requests visible to tailors (pending_bids status).
 */
export async function getPendingRequests(
  params: PaginationParams = {}
): Promise<ServiceResult<{ data: DesignRequestRow[]; total: number }>> {
  try {
    const supabase = createClient()
    const { page = 1, limit = 20 } = params
    const from = (page - 1) * limit
    const to   = from + limit - 1

    const { data, error, count } = await supabase
      .from('design_requests')
      .select('*', { count: 'exact' })
      .eq('status', 'pending_bids')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return err(mapSupabaseError(error, 'getPendingRequests'))
    return ok({ data: (data ?? []) as DesignRequestRow[], total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getPendingRequests'))
  }
}
