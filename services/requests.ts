/**
 * Design Requests service
 */

import { createClient } from '@/lib/supabase/server'
import type { DesignRequestRow, QuotationRow } from '@/types/database'
import { ok, err, mapSupabaseError, mapUnknownError, type ServiceResult } from './errors'

export interface CreateRequestParams {
  imageUrl:   string
  aiTags:     unknown
  budgetMin:  number
  budgetMax:  number
  deadline:   string
  notes?:     string
  isDraft?:   boolean
}

/**
 * Create a new design request.
 * If isDraft = true, saves to wishlist_items instead.
 */
export async function createDesignRequest(
  params: CreateRequestParams
): Promise<ServiceResult<{ id: string }>> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err({ code: 'UNAUTHORIZED', message: 'Not authenticated.' })

    const { imageUrl, aiTags, budgetMin, budgetMax, deadline, notes, isDraft } = params

    if (isDraft) {
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert({
          customer_id: user.id,
          image_url:   imageUrl,
          ai_tags:     aiTags,
          budget_min:  budgetMin,
          budget_max:  budgetMax,
          deadline,
          notes,
        })
        .select('id')
        .single()

      if (error) return err(mapSupabaseError(error, 'createDesignRequest(draft)'))
      return ok({ id: data.id })
    } else {
      const { data, error } = await supabase
        .from('design_requests')
        .insert({
          customer_id: user.id,
          image_url:   imageUrl,
          ai_tags:     aiTags,
          budget_min:  budgetMin,
          budget_max:  budgetMax,
          deadline,
          notes,
          status:      'pending_bids',
        })
        .select('id')
        .single()

      if (error) return err(mapSupabaseError(error, 'createDesignRequest'))
      return ok({ id: data.id })
    }
  } catch (e) {
    return err(mapUnknownError(e, 'createDesignRequest'))
  }
}

/**
 * Tailor: Submit a quote (quotation) on an open request.
 */
export async function submitBid(params: {
  requestId:     string
  price:         number
  estimatedDays: number
  note?:         string
}): Promise<ServiceResult<QuotationRow>> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err({ code: 'UNAUTHORIZED', message: 'Not authenticated.' })

    const { data, error } = await supabase
      .from('quotations')
      .insert({
        request_id:     params.requestId,
        tailor_id:      user.id,
        price:          params.price,
        estimated_days: params.estimatedDays,
        note:           params.note,
        status:         'pending',
        bid_status:     'pending',
      })
      .select()
      .single()

    if (error) return err(mapSupabaseError(error, 'submitBid'))
    return ok(data as QuotationRow)
  } catch (e) {
    return err(mapUnknownError(e, 'submitBid'))
  }
}

/**
 * Customer: Accept a tailor's quote.
 * Calls the fn_accept_bid Postgres function to update the request and reject other quotes atomically.
 */
export async function acceptBid(
  requestId: string,
  quotationId: string
): Promise<ServiceResult<void>> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err({ code: 'UNAUTHORIZED', message: 'Not authenticated.' })

    const { data, error } = await supabase.rpc('fn_accept_bid', {
      p_request_id:  requestId,
      p_quote_id:    quotationId,
      p_customer_id: user.id
    })

    if (error) return err(mapSupabaseError(error, 'acceptBid'))
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((data as any)?.error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return err({ code: 'VALIDATION', message: (data as any).error })
    }

    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'acceptBid'))
  }
}


