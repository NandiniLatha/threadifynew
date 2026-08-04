import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"

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

    if (!["pending_bids", "assigned"].includes(designRequest.status)) {
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
    // razorpay_order_id and razorpay_payment_id intentionally left null.
    // When real Razorpay is wired, these get filled in by the webhook handler.

    // 1. Update design_requests: assign tailor, set payment fields, advance status
    const { error: updateErr } = await supabase
      .from("design_requests")
      .update({
        accepted_quotation_id: quoteId,
        tailor_id: quote.tailor_id,
        amount_paid: amountPaid,
        platform_commission: platformCommission,
        razorpay_order_id: null,   // filled in when real Razorpay is connected
        razorpay_payment_id: null, // filled in when real Razorpay is connected
        status: "paid",
      })
      .eq("id", requestId)

    if (updateErr) {
      console.error("[mock-pay] design_requests update failed:", updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // 2. Mark this quotation as accepted
    await supabase
      .from("quotations")
      .update({ status: "accepted" })
      .eq("id", quoteId)

    // 3. Notify the tailor
    await createNotification(
      supabase,
      quote.tailor_id,
      "🎉 A customer has selected your quote and confirmed payment. Check your orders.",
      "/tailor/orders"
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred."
    console.error("[mock-pay] unhandled error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
