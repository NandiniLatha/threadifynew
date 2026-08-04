/**
 * Wishlist service
 */

import { createClient } from '@/lib/supabase/server'
import type { WishlistItemRow } from '@/types/database'
import { ok, err, mapSupabaseError, mapUnknownError, type ServiceResult } from './errors'

/**
 * Get all wishlist items for the current user, newest first.
 */
export async function getWishlistItems(
  params: { page?: number; limit?: number } = {}
): Promise<ServiceResult<{ data: WishlistItemRow[]; total: number }>> {
  try {
    const supabase = createClient()
    const { page = 1, limit = 20 } = params
    const from = (page - 1) * limit
    const to   = from + limit - 1

    const { data, error, count } = await supabase
      .from('wishlist_items')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return err(mapSupabaseError(error, 'getWishlistItems'))
    return ok({ data: (data ?? []) as WishlistItemRow[], total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getWishlistItems'))
  }
}

/**
 * Delete a wishlist item (owner only, enforced by RLS).
 */
export async function deleteWishlistItem(id: string): Promise<ServiceResult<void>> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', id)

    if (error) return err(mapSupabaseError(error, 'deleteWishlistItem'))
    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'deleteWishlistItem'))
  }
}

/**
 * Promote a wishlist item to a live design request.
 * Copies the wishlist item data into design_requests, then deletes the draft.
 */
export async function promoteWishlistToRequest(
  wishlistItemId: string,
  overrides: {
    budgetMin: number
    budgetMax: number
    deadline:  string
    notes?:    string
  }
): Promise<ServiceResult<{ requestId: string }>> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err({ code: 'UNAUTHORIZED', message: 'Not authenticated.' })

    // Fetch the draft
    const { data: item, error: fetchErr } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('id', wishlistItemId)
      .single()

    if (fetchErr || !item) {
      return err({ code: 'NOT_FOUND', message: 'Wishlist item not found.' })
    }

    // Insert as design_request
    const { data: request, error: insertErr } = await supabase
      .from('design_requests')
      .insert({
        customer_id: user.id,
        image_url:   item.image_url,
        ai_tags:     item.ai_tags,
        budget_min:  overrides.budgetMin,
        budget_max:  overrides.budgetMax,
        deadline:    overrides.deadline,
        notes:       overrides.notes ?? item.notes ?? '',
        status:      'pending_bids',
      })
      .select('id')
      .single()

    if (insertErr || !request) {
      return err(mapSupabaseError(insertErr, 'promoteWishlistToRequest'))
    }

    // Delete the draft
    await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', wishlistItemId)

    return ok({ requestId: request.id })
  } catch (e) {
    return err(mapUnknownError(e, 'promoteWishlistToRequest'))
  }
}
