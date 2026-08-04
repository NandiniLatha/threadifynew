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
        // Update database: mark design request as Paid (db status 'assigned')
        const { error } = await supabaseAdmin
          .from("design_requests")
          .update({
            status: "assigned", // UI representing 'Paid'
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
