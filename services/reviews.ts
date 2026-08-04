/**
 * Reviews service
 */

import { createClient } from '@/lib/supabase/server'
import type { ReviewRow } from '@/types/database'
import { ok, err, mapSupabaseError, mapUnknownError, type ServiceResult } from './errors'

export interface ReviewWithCustomer extends ReviewRow {
  customer: { id: string; name: string | null; avatar_url: string | null } | null
}

/**
 * List reviews for a tailor, newest first.
 */
export async function getTailorReviews(
  tailorId: string,
  params: { limit?: number; page?: number } = {}
): Promise<ServiceResult<{ data: ReviewWithCustomer[]; total: number }>> {
  try {
    const supabase = createClient()
    const { page = 1, limit = 20 } = params
    const from = (page - 1) * limit
    const to   = from + limit - 1

    const { data, error, count } = await supabase
      .from('reviews')
      .select(`
        *,
        order:design_requests!order_id ( customer_id, customer:users!customer_id (id, name, avatar_url) )
      `, { count: 'exact' })
      .eq('tailor_id', tailorId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return err(mapSupabaseError(error, 'getTailorReviews'))

    const mapped = (data ?? []).map(r => {
      // Extract customer nested in design_requests relation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customer = (r as any).order?.customer ?? null
      return {
        ...r,
        customer
      }
    }) as ReviewWithCustomer[]

    return ok({ data: mapped, total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getTailorReviews'))
  }
}

/**
 * Submit a review for a completed order.
 * Triggers order status update to 'reviewed'.
 */
export async function submitReview(params: {
  orderId: string
  rating:  number
  comment: string
}): Promise<ServiceResult<ReviewRow>> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err({ code: 'UNAUTHORIZED', message: 'Not authenticated.' })

    const { data: reviewData, error: reviewErr } = await supabase
      .from('reviews')
      .insert({
        order_id: params.orderId,
        rating:   params.rating,
        comment:  params.comment,
      })
      .select()
      .single()

    if (reviewErr) return err(mapSupabaseError(reviewErr, 'submitReview'))

    // Update order status to 'reviewed'
    const { data: orderUpdateResult, error: updateErr } = await supabase.rpc('fn_update_order_status', {
      p_order_id:   params.orderId,
      p_new_status: 'reviewed',
      p_actor_id:   user.id
    })

    if (updateErr) return err(mapSupabaseError(updateErr, 'submitReview/update_status'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((orderUpdateResult as any)?.error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return err({ code: 'VALIDATION', message: (orderUpdateResult as any).error })
    }

    return ok(reviewData as ReviewRow)
  } catch (e) {
    return err(mapUnknownError(e, 'submitReview'))
  }
}
