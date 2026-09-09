import { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export type AdminActionType =
  | "VIEW_ORDER"
  | "VIEW_DISPUTE"
  | "VIEW_CUSTOMER"
  | "VIEW_TAILOR"
  | "CREATE_DISPUTE_NOTE"
  | "RESOLVE_DISPUTE"
  | "REJECT_DISPUTE"
  | "CLOSE_DISPUTE"

export interface AdminAuditParams {
  action: AdminActionType
  orderId?: string
  disputeId?: string
  targetUserId?: string
  reason?: string
  metadata?: Record<string, any>
}

/**
 * Records an action performed by an Admin.
 * Resolves the admin identity from the server-side session.
 */
export async function logAdminAction(params: AdminAuditParams): Promise<void> {
  const supabase = createClient()
  
  // Resolve admin identity safely
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData?.user) {
    console.error("[AuditLog] Failed to record action: Unauthenticated")
    return
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .single()

  if (userProfile?.role !== "admin") {
    console.error("[AuditLog] Failed to record action: Unauthorized (not an admin)")
    return
  }

  const { error: insertErr } = await supabase
    .from("admin_audit_logs")
    .insert({
      admin_id: authData.user.id,
      action: params.action,
      order_id: params.orderId || null,
      dispute_id: params.disputeId || null,
      target_user_id: params.targetUserId || null,
      reason: params.reason || null,
      metadata: params.metadata || {}
    })

  if (insertErr) {
    console.error("[AuditLog] Failed to insert audit log:", insertErr.message)
    // We intentionally don't throw to prevent blocking non-critical reads (like VIEW_ORDER)
    // However, mutations should ideally wait or check for success.
  }
}
