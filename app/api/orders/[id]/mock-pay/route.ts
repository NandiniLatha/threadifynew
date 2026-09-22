import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/orders/[id]/mock-pay
 *
 * Simulates the Razorpay payment step until real Razorpay Route is approved.
 *
 * When real Razorpay is ready, ONLY this file's internals need to change:
 *   - Create a real Razorpay order here
 *   - Return a { rzpOrderId, amount, key } to the client
 *   - The client opens the Razorpay checkout widget
 *   - On success the webhook (or a verify route) handles the DB update
 *
 * The calling button code (page.tsx) calls POST /api/orders/[id]/mock-pay
 * and expects { success: true } — that contract does not change.
 *
 * Body: { quoteId: string }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { error: "You must be signed in to confirm payment." },
        { status: 401 }
      )
    }

    const requestId = params.id
    const body = await request.json()
    const { quoteId } = body as { quoteId: string }

    if (!quoteId) {
      return NextResponse.json(
        { error: "A valid quotation ID is required." },
        { status: 400 }
      )
    }

    // Verify the design request belongs to this customer
    const { data: designRequest, error: reqErr } = await supabase
      .from("design_requests")
      .select("id, status, customer_id")
      .eq("id", requestId)
      .single()

    if (reqErr || !designRequest) {
      return NextResponse.json({ error: "Design request not found." }, { status: 404 })
    }

    if (designRequest.customer_id !== user.id) {
      return NextResponse.json({ error: "Only the request owner can confirm payment." }, { status: 403 })
    }

    // Allowed payment statuses:
    //   "pending_bids" — no quotes yet; customer initiated payment before any tailor replied (edge case)
    //   "quoted"       — set AUTOMATICALLY by the DB trigger trg_sync_design_request_status_insert
    //                    (migration 20260916000000_sync_design_request_status.sql) when the first
    //                    quotation is inserted. This is the NORMAL state at payment time.
    //   "assigned"     — tailor was manually assigned without the bidding flow
    if (!["pending_bids", "quoted", "assigned"].includes(designRequest.status)) {
      return NextResponse.json(
        { error: `Cannot pay for a request with status '${designRequest.status}'.` },
        { status: 409 }
      )
    }

    // Fetch the quotation to get price and tailor
    const { data: quote, error: quoteErr } = await supabase
      .from("quotations")
      .select("id, price, tailor_id, request_id")
      .eq("id", quoteId)
      .eq("request_id", requestId)
      .single()

    if (quoteErr || !quote) {
      return NextResponse.json({ error: "Price Quote not found for this request." }, { status: 404 })
    }

    const amountPaid = Number(quote.price)
    const platformCommission = parseFloat((amountPaid * 0.10).toFixed(2))

    // --- SIMULATED PAYMENT ---
    // We generate a demo transaction ID since this is a portfolio project.
    // razorpay_order_id is left null, but we'll use razorpay_payment_id for the demo ID.
    const demoTransactionId = `THR-DEMO-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`
    // When real Razorpay is wired, these get filled in by the webhook handler.

    // Use Service Role for state mutations to bypass RLS restrictions
    const supabaseAdmin = createAdminClient()

    // 1. Update design_requests: assign tailor, set payment fields, advance status
    const { error: updateErr } = await supabaseAdmin
      .from("design_requests")
      .update({
        accepted_quotation_id: quoteId,
        tailor_id: quote.tailor_id,
        amount_paid: amountPaid,
        platform_commission: platformCommission,
        razorpay_order_id: null,
        razorpay_payment_id: demoTransactionId,
        status: "paid",
        production_evidence_status: "none",
      })
      .eq("id", requestId)

    if (updateErr) {
      console.error("[mock-pay] design_requests update failed:", updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // 1b. Create a verified payment record to enforce genuine payment status.
    // IMPORTANT: Must use supabaseAdmin (service-role) — the payments table has
    // no INSERT policy for regular authenticated users (by design; see migration
    // 20260721000004_rls_additions.sql lines 166-168). Using the RLS-bound client
    // would cause a 403/42501 here and leave the order in a corrupt paid-but-no-
    // payment-record state.
    // Upsert (instead of insert) makes this idempotent: if the customer retries
    // after a transient error the UNIQUE(order_id) constraint won't block them.
    const tailorPayout = amountPaid - platformCommission
    const { error: paymentErr } = await supabaseAdmin
      .from("payments")
      .upsert(
        {
          order_id: requestId,
          customer_id: user.id,
          tailor_id: quote.tailor_id,
          amount: amountPaid,
          platform_fee: platformCommission,
          tailor_payout: tailorPayout,
          currency: "INR",
          payment_status: "completed",
          razorpay_payment_id: demoTransactionId,
        },
        { onConflict: "order_id" }
      )

    if (paymentErr) {
      console.error("[mock-pay] payments insert failed:", paymentErr.message)
      return NextResponse.json({ error: paymentErr.message }, { status: 500 })
    }

    // 2. Mark this quotation as accepted.
    // MUST use supabaseAdmin (service-role): the customer's JWT has no UPDATE
    // policy on quotations (only tailors can update their own via FOR ALL USING
    // auth.uid() = tailor_id). Using the RLS-bound client here silently returns
    // 0 rows affected, leaving the quotation perpetually in "pending" status
    // even after payment is confirmed.
    // Authorization is already fully enforced above (steps 1-3: auth check,
    // customer_id ownership, and quote.request_id == requestId validation).
    const { error: quoteUpdateErr } = await supabaseAdmin
      .from("quotations")
      .update({ status: "accepted" })
      .eq("id", quoteId)

    if (quoteUpdateErr) {
      console.error("[mock-pay] quotations update failed:", quoteUpdateErr.message)
      return NextResponse.json({ error: quoteUpdateErr.message }, { status: 500 })
    }

    // 3. Notify the tailor
    await createNotification(
      supabase,
      quote.tailor_id,
      "🎉 A customer has selected your quote and confirmed payment. Check your orders.",
      `/tailor/orders?id=${requestId}`
    )

    return NextResponse.json({ success: true, transactionId: demoTransactionId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred."
    console.error("[mock-pay] unhandled error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
