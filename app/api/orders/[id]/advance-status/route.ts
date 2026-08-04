import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"

/**
 * POST /api/orders/[id]/advance-status
 *
 * Called by the tailor to progress an order through production stages.
 * Valid transitions (enforced server-side):
 *   paid → in_production
 *   in_production → shipped
 *
 * The 'shipped → delivered' transition is triggered by the customer
 * via POST /api/orders/[id]/confirm-delivery.
 */

const ALLOWED_TRANSITIONS: Record<string, string> = {
  paid: "in_production",
  in_production: "shipped",
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { error: "You must be signed in as the assigned tailor." },
        { status: 401 }
      )
    }

    const requestId = params.id

    // Fetch the design request — verify tailor ownership
    const { data: designRequest, error: reqErr } = await supabase
      .from("design_requests")
      .select("id, status, tailor_id, customer_id")
      .eq("id", requestId)
      .single()

    if (reqErr || !designRequest) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    if (designRequest.tailor_id !== user.id) {
      return NextResponse.json(
        { error: "Only the assigned tailor can advance this order." },
        { status: 403 }
      )
    }

    const currentStatus = designRequest.status
    const nextStatus = ALLOWED_TRANSITIONS[currentStatus]

    if (!nextStatus) {
      return NextResponse.json(
        { error: `No valid transition from status '${currentStatus}'.` },
        { status: 409 }
      )
    }

    // Update status
    const { error: updateErr } = await supabase
      .from("design_requests")
      .update({ status: nextStatus })
      .eq("id", requestId)

    if (updateErr) {
      console.error("[advance-status] update failed:", updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Notify the customer
    const statusLabels: Record<string, string> = {
      in_production: "Your garment is now In Production ✂️",
      shipped: "Your garment has been Shipped 📦 — get ready to confirm delivery!",
    }
    await createNotification(
      supabase,
      designRequest.customer_id,
      statusLabels[nextStatus] ?? `Your order status has been updated to ${nextStatus}.`,
      `/dashboard/orders/${requestId}`
    )

    return NextResponse.json({ success: true, status: nextStatus })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred."
    console.error("[advance-status] unhandled error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
