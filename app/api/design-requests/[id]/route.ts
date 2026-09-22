import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

/**
 * Allowed status list for deletion.
 * A request can ONLY be deleted if it is in an early, un-progressed stage.
 */
const CANCELLABLE_STATUSES = ["draft", "pending_bids", "quoted", "cancelled"]

/**
 * DELETE /api/design-requests/[id]
 *
 * Secure API endpoint for a customer to delete their own cancellable design request.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { error: "You must be signed in to delete a design request." },
        { status: 401 }
      )
    }

    const requestId = params.id
    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required." },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 1. Fetch the design request to verify existence, ownership, and current status
    const { data: designRequest, error: fetchErr } = await supabaseAdmin
      .from("design_requests")
      .select("id, status, customer_id")
      .eq("id", requestId)
      .single()

    if (fetchErr || !designRequest) {
      return NextResponse.json(
        { error: "Design request not found." },
        { status: 404 }
      )
    }

    // 2. Strict Ownership Check: Must be the customer who created the request
    if (designRequest.customer_id !== user.id) {
      return NextResponse.json(
        { error: "Only the customer who created this request can delete it." },
        { status: 403 }
      )
    }

    // 3. Status Check: Reject deletion if request has progressed into payment/production/order fulfillment
    if (!CANCELLABLE_STATUSES.includes(designRequest.status)) {
      return NextResponse.json(
        { error: "This request can no longer be deleted because it has already progressed." },
        { status: 409 }
      )
    }

    // 4. Payment Safeguard Check: Double check no active payment record exists for this request
    const { data: paymentRecord } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("order_id", requestId)
      .maybeSingle()

    if (paymentRecord) {
      return NextResponse.json(
        { error: "This request can no longer be deleted because it has an active payment record." },
        { status: 409 }
      )
    }

    // 5. Delete request using admin client to reliably delete row from Postgres
    const { data: deletedRows, error: deleteErr } = await supabaseAdmin
      .from("design_requests")
      .delete()
      .eq("id", requestId)
      .eq("customer_id", user.id)
      .select("id")

    if (deleteErr) {
      console.error("[delete-design-request] Delete error:", deleteErr.message)
      return NextResponse.json(
        { error: "Failed to delete request. Please try again later." },
        { status: 500 }
      )
    }

    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json(
        { error: "Request could not be deleted or was already removed." },
        { status: 404 }
      )
    }

    // 6. Cleanup related notifications referencing this request
    try {
      await supabaseAdmin
        .from("notifications")
        .delete()
        .ilike("link", `%${requestId}%`)
    } catch (notifErr) {
      console.warn("[delete-design-request] Notification cleanup warning:", notifErr)
    }

    return NextResponse.json({
      success: true,
      message: "Request deleted successfully.",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred."
    console.error("[delete-design-request] Unhandled error:", message)
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting the request." },
      { status: 500 }
    )
  }
}
