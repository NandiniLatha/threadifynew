import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { logAdminAction, AdminActionType } from "@/app/api/admin/audit/helpers"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const disputeId = params.id

    // 1. Verify Authentication & Role
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", authData.user.id)
      .single()

    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 })
    }

    const body = await request.json()
    const { status, adminNotes, actionReason } = body

    // Validate inputs
    if (status && !["open", "resolved", "rejected", "closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid dispute status." }, { status: 400 })
    }

    // 2. Verify Dispute Exists
    const { data: dispute, error: disputeErr } = await supabase
      .from("disputes")
      .select("id, order_id, raised_by, status, admin_notes")
      .eq("id", disputeId)
      .single()

    if (disputeErr || !dispute) {
      return NextResponse.json({ error: "Dispute not found." }, { status: 404 })
    }

    if (status && status !== dispute.status) {
      let validTransition = false
      if (dispute.status === "open" && ["resolved", "rejected", "closed"].includes(status)) {
        validTransition = true
      } else if (dispute.status === "resolved" && status === "closed") {
        validTransition = true
      } else if (dispute.status === "rejected" && status === "closed") {
        validTransition = true
      }

      if (!validTransition) {
        return NextResponse.json({ error: `Cannot transition dispute from ${dispute.status} to ${status}` }, { status: 400 })
      }
    }

    const updatePayload: any = {}
    if (status && status !== dispute.status) updatePayload.status = status
    if (typeof adminNotes === "string" && adminNotes !== dispute.admin_notes) updatePayload.admin_notes = adminNotes

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ success: true, message: "No changes detected." })
    }

    // 3. Update the dispute
    const { error: updateErr } = await supabase
      .from("disputes")
      .update(updatePayload)
      .eq("id", disputeId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // 4. Record Audit Log
    let actionType: AdminActionType = "CREATE_DISPUTE_NOTE"
    if (status === "resolved") actionType = "RESOLVE_DISPUTE"
    else if (status === "rejected") actionType = "REJECT_DISPUTE"
    else if (status === "closed") actionType = "CLOSE_DISPUTE"

    await logAdminAction({
      action: actionType,
      disputeId: disputeId,
      orderId: dispute.order_id,
      targetUserId: dispute.raised_by,
      reason: actionReason || "Admin manual dispute mutation",
      metadata: {
        previous_status: dispute.status,
        new_status: status || dispute.status,
        notes_updated: typeof adminNotes === "string"
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
