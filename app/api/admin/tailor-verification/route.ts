import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"

/**
 * POST /api/admin/tailor-verification
 *
 * Called by authenticated Admins to approve or reject a tailor application.
 * Body: { userId: string, status: "approved" | "rejected" }
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { error: "You must be signed in as an admin to perform verification." },
        { status: 401 }
      )
    }

    // 1. Verify caller is an authorized Admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can verify tailor applications." },
        { status: 403 }
      )
    }

    const { userId, status } = await request.json()

    if (!userId || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json(
        { error: "Valid userId and status ('approved' or 'rejected') are required." },
        { status: 400 }
      )
    }

    // 2. Verify target application exists
    const { data: tailorApp, error: appErr } = await supabase
      .from("tailor_profiles")
      .select("user_id, verification_status")
      .eq("user_id", userId)
      .single()

    if (appErr || !tailorApp) {
      return NextResponse.json({ error: "Tailor application not found." }, { status: 404 })
    }

    // 3. Perform update using Service Role to ensure state updates execute securely
    // Trigger `trg_sync_tailor_verification_role` in Postgres will automatically
    // update public.users.role to 'tailor' when verification_status = 'approved'.
    const supabaseAdmin = createAdminClient()
    const { error: updateErr } = await supabaseAdmin
      .from("tailor_profiles")
      .update({ verification_status: status })
      .eq("user_id", userId)

    if (updateErr) {
      console.error("[admin-tailor-verification] update failed:", updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // 4. Send notification to the applicant
    if (status === "approved") {
      await createNotification(
        supabase,
        userId,
        "🎉 Congratulations! Your tailor application has been approved. You can now access tailor features!",
        "/tailor/requests"
      )
    } else {
      await createNotification(
        supabase,
        userId,
        "Your tailor application status was updated to rejected. Please contact support for feedback.",
        "/dashboard"
      )
    }

    return NextResponse.json({ success: true, status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred during verification."
    console.error("[admin-tailor-verification] error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
