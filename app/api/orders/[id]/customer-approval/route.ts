import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"

/**
 * POST /api/orders/[id]/customer-approval
 * 
 * Used by the customer to either accept the production evidence for the current stage,
 * or request changes.
 * 
 * Body: { action: "approve" | "request_changes", stage: string, comment?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const orderId = params.id
    const { action, stage, comment } = await request.json()

    if (!action || !stage) {
      return NextResponse.json(
        { error: "action and stage are required." },
        { status: 400 }
      )
    }

    if (action === "request_changes" && !comment?.trim()) {
      return NextResponse.json(
        { error: "A comment is required when requesting changes." },
        { status: 400 }
      )
    }

    // Verify the caller is the customer for this order
    const { data: orderRow, error: orderErr } = await supabase
      .from("design_requests")
      .select("id, customer_id, tailor_id, status, production_evidence_status")
      .eq("id", orderId)
      .single()

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    if (orderRow.customer_id !== user.id) {
      return NextResponse.json(
        { error: "Only the customer can approve or request changes." },
        { status: 403 }
      )
    }

    if (orderRow.production_evidence_status !== "waiting_for_customer_approval") {
      return NextResponse.json(
        { error: "This order is not currently awaiting customer approval." },
        { status: 409 }
      )
    }

    if (orderRow.status !== stage) {
      return NextResponse.json(
        { error: "Approval stage mismatch." },
        { status: 400 }
      )
    }

    if (action === "approve") {
      const supabaseAdmin = createAdminClient()
      const { error: updateErr } = await supabaseAdmin
        .from("design_requests")
        .update({ production_evidence_status: "none" })
        .eq("id", orderId)

      if (updateErr) throw new Error(updateErr.message)

      // Notify tailor
      if (orderRow.tailor_id) {
        await createNotification(
          supabase,
          orderRow.tailor_id,
          `✅ The customer has approved the ${stage} evidence! You can now proceed.`,
          `/tailor/orders?id=${orderId}`
        )
      }

      return NextResponse.json({ success: true, newStatus: "none" })

    } else if (action === "request_changes") {
      // Insert feedback
      const { error: feedbackErr } = await supabase
        .from("production_feedback")
        .insert({
          request_id: orderId,
          production_stage: stage,
          customer_id: user.id,
          comment: comment,
        })

      if (feedbackErr) throw new Error(feedbackErr.message)

      // Update evidence status
      const supabaseAdmin = createAdminClient()
      const { error: updateErr } = await supabaseAdmin
        .from("design_requests")
        .update({ production_evidence_status: "changes_requested" })
        .eq("id", orderId)

      if (updateErr) throw new Error(updateErr.message)

      // Notify tailor
      if (orderRow.tailor_id) {
        await createNotification(
          supabase,
          orderRow.tailor_id,
          `⚠️ The customer has requested changes for the ${stage} phase. Please review their feedback.`,
          `/tailor/orders?id=${orderId}`
        )
      }

      return NextResponse.json({ success: true, newStatus: "changes_requested" })

    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 })
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error."
    console.error("[customer-approval] unhandled error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
