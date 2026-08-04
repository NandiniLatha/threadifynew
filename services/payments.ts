/**
 * Payments service
 * Payment records are created server-side only (API routes).
 * Client-side reads are allowed via RLS (customer/tailor see own records).
 */

import { createClient } from '@/lib/supabase/server'
import type { PaymentRow } from '@/types/database'
import { ok, err, mapSupabaseError, mapUnknownError, type ServiceResult } from './errors'

export interface PaymentWithOrder extends PaymentRow {
  order: {
    id:        string
    image_url: string
    status:    string
    deadline:  string
    ai_tags:   unknown
  } | null
  tailor: { id: string; name: string | null } | null
}

/**
 * List payments for the authenticated customer.
 */
export async function getCustomerPayments(
  params: { page?: number; limit?: number } = {}
): Promise<ServiceResult<{ data: PaymentWithOrder[]; total: number }>> {
  try {
    const supabase = createClient()
    const { page = 1, limit = 20 } = params
    const from = (page - 1) * limit
    const to   = from + limit - 1

    const { data, error, count } = await supabase
      .from('payments')
      .select(`
        *,
        order:design_requests!order_id (id, image_url, status, deadline, ai_tags),
        tailor:users!tailor_id (id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return err(mapSupabaseError(error, 'getCustomerPayments'))
    return ok({ data: (data ?? []) as PaymentWithOrder[], total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getCustomerPayments'))
  }
}

/**
 * List payouts (payments) for the authenticated tailor.
 */
export async function getTailorPayouts(
  params: { page?: number; limit?: number } = {}
): Promise<ServiceResult<{ data: PaymentWithOrder[]; total: number }>> {
  try {
    const supabase = createClient()
    const { page = 1, limit = 20 } = params
    const from = (page - 1) * limit
    const to   = from + limit - 1

    const { data, error, count } = await supabase
      .from('payments')
      .select(`
        *,
        order:design_requests!order_id (id, image_url, status, deadline, ai_tags),
        tailor:users!tailor_id (id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return err(mapSupabaseError(error, 'getTailorPayouts'))
    return ok({ data: (data ?? []) as PaymentWithOrder[], total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getTailorPayouts'))
  }
}

/**
 * Get payment record for a specific order (server-side use only).
 */
export async function getPaymentByOrderId(
  orderId: string
): Promise<ServiceResult<PaymentRow>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (error) return err(mapSupabaseError(error, 'getPaymentByOrderId'))
    if (!data)  return err({ code: 'NOT_FOUND', message: 'Payment record not found.' })
    return ok(data as PaymentRow)
  } catch (e) {
    return err(mapUnknownError(e, 'getPaymentByOrderId'))
  }
}

/**
 * Create a payment record. Server-side API routes only.
 * Inserted with full amount/fee breakdown at payment confirmation time.
 */
export async function createPaymentRecord(params: {
  orderId:           string
  customerId:        string
  tailorId:          string
  amount:            number
  platformFeeRate?:  number  // default 0.10 (10%)
  razorpayOrderId?:  string | null
  razorpayPaymentId?: string | null
  razorpaySignature?: string | null
}): Promise<ServiceResult<PaymentRow>> {
  try {
    const supabase = createClient()
    const {
      orderId, customerId, tailorId, amount,
      platformFeeRate = 0.10,
      razorpayOrderId = null,
      razorpayPaymentId = null,
      razorpaySignature = null,
    } = params

    const platform_fee   = parseFloat((amount * platformFeeRate).toFixed(2))
    const tailor_payout  = parseFloat((amount - platform_fee).toFixed(2))
    const payment_status = (razorpayPaymentId != null) ? 'completed' : 'pending'

    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id:            orderId,
        customer_id:         customerId,
        tailor_id:           tailorId,
        amount,
        platform_fee,
        tailor_payout,
        currency:            'INR',
        payment_status,
        razorpay_order_id:   razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature:  razorpaySignature,
      })
      .select()
      .single()

    if (error) return err(mapSupabaseError(error, 'createPaymentRecord'))
    return ok(data as PaymentRow)
  } catch (e) {
    return err(mapUnknownError(e, 'createPaymentRecord'))
  }
}
