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

