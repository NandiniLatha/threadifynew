import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

/**
 * POST /api/orders/[id]/cancel
 *
 * Called by the customer to cancel their design request.
 * Only allowed if the order is in 'pending_bids' or 'assigned' status.
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
        { error: "You must be signed in to cancel an order." },
        { status: 401 }
      )
    }

    const requestId = params.id

    // Fetch the design request and verify ownership
    const { data: designRequest, error: reqErr } = await supabase
      .from("design_requests")
      .select("id, status, customer_id")
      .eq("id", requestId)
      .single()

    if (reqErr || !designRequest) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    if (designRequest.customer_id !== user.id) {
      return NextResponse.json(
        { error: "Only the customer who created this request can cancel it." },
        { status: 403 }
      )
    }

    const currentStatus = designRequest.status

    if (currentStatus !== "pending_bids" && currentStatus !== "assigned") {
      return NextResponse.json(
        { error: `Cannot cancel an order in the '${currentStatus}' status. Orders can only be cancelled before payment is made.` },
        { status: 403 }
      )
    }

    // Update status securely bypassing RLS
    const supabaseAdmin = createAdminClient()
    const { error: updateErr } = await supabaseAdmin
      .from("design_requests")
      .update({ status: "cancelled" })
      .eq("id", requestId)

    if (updateErr) {
      console.error("[cancel-order] update failed:", updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: "cancelled" })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred."
    console.error("[cancel-order] unhandled error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
