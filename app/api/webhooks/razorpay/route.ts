import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import Razorpay from "razorpay"

// Use service role client on webhook server to bypass RLS policies
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export async function POST(request: Request) {
  try {
    const bodyText = await request.text()
    const signature = request.headers.get("x-razorpay-signature") || ""
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ""

    // Validate signature if webhookSecret is configured
    if (webhookSecret && signature && !webhookSecret.includes("placeholder")) {
      const isValid = Razorpay.validateWebhookSignature(
        bodyText,
        signature,
        webhookSecret
      )

      if (!isValid) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
      }
    }

    const payload = JSON.parse(bodyText)
    const event = payload.event

    if (event === "order.paid") {
      const orderEntity = payload.payload.order.entity
      const notes = orderEntity.notes || {}
      
      const requestId = notes.requestId

      if (requestId) {
        // We need to fetch the design request to get customer_id and tailor_id
        const { data: request, error: reqErr } = await supabaseAdmin
          .from("design_requests")
          .select("customer_id, tailor_id, accepted_quotation_id")
          .eq("id", requestId)
          .single()

        if (request && !reqErr) {
          // Calculate amount from payload or quotation
          const { data: quote } = await supabaseAdmin
            .from("quotations")
            .select("price")
            .eq("id", request.accepted_quotation_id)
            .single()

          const amountPaid = quote ? Number(quote.price) : 0
          const platformCommission = parseFloat((amountPaid * 0.10).toFixed(2))
          const tailorPayout = amountPaid - platformCommission

          const { error: paymentErr } = await supabaseAdmin
            .from("payments")
            .upsert({
              order_id: requestId,
              customer_id: request.customer_id,
              tailor_id: request.tailor_id,
              amount: amountPaid,
              platform_fee: platformCommission,
              tailor_payout: tailorPayout,
              currency: "INR",
              payment_status: "completed",
              razorpay_order_id: orderEntity.id,
            }, { onConflict: "order_id" })

          if (paymentErr) {
            console.error("Webhook payment insert error", paymentErr.message)
          }
        }

        // Update database: mark design request as 'paid'
        const { error } = await supabaseAdmin
          .from("design_requests")
          .update({
            status: "paid",
            production_evidence_status: "none"
          })
          .eq("id", requestId)

        if (error) {
          console.error("Webhook database update error", error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook handler failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
