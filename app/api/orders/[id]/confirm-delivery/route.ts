import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"

/**
 * POST /api/orders/[id]/confirm-delivery
 *
 * Called by the customer to confirm they received the garment.
 * Sets status = 'delivered' and records delivered_confirmed_at.
 *
 * NOTE: Payout release to the tailor is intentionally skipped here
 * until real Razorpay Route is approved. When Razorpay is wired,
 * the payout transfer logic goes inside this route's try block —
 * the calling button code does not need to change.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { error: "You must be signed in to confirm delivery." },
        { status: 401 }
      )
    }

    const orderId = params.id

    // Fetch order — verify customer ownership and current status
    const { data: order, error: orderErr } = await supabase
      .from("design_requests")
      .select("id, status, customer_id, tailor_id")
      .eq("id", orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    if (order.customer_id !== user.id) {
      return NextResponse.json(
        { error: "Only the purchasing customer can confirm delivery." },
        { status: 403 }
      )
    }

    if (order.status !== "shipped") {
      return NextResponse.json(
        { error: `Cannot confirm delivery for an order with status '${order.status}'. Order must be in 'shipped' state.` },
        { status: 409 }
      )
    }

    // Update status to delivered + record confirmation timestamp
    const { error: updateErr } = await supabase
      .from("design_requests")
      .update({
        status: "delivered",
        delivered_confirmed_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateErr) {
      console.error("[confirm-delivery] update failed:", updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Notify the tailor
    if (order.tailor_id) {
      await createNotification(
        supabase,
        order.tailor_id,
        "✅ The customer has confirmed delivery. The order is complete!",
        "/tailor/orders"
      )
    }

    return NextResponse.json({ success: true, message: "Delivery confirmed." })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delivery confirmation failed."
    console.error("[confirm-delivery] unhandled error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
