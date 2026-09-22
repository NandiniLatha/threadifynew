import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Creates a notification row for a given user.
 *
 * Uses the service-role (admin) client for the INSERT because the
 * notifications RLS policy is `FOR ALL USING (auth.uid() = user_id)`,
 * which blocks any cross-user write. Every caller supplies a recipient
 * (userId) from a server-validated DB column — never from raw request
 * input — so switching to the admin client does not introduce a
 * recipient-spoofing risk.
 *
 * The _supabase parameter is intentionally retained (but unused) so
 * that all existing call sites remain compatible without changes.
 *
 * Silently fails (logs warning) so it never breaks the primary request.
 */
export async function createNotification(
  _supabase: SupabaseClient,
  userId: string,
  message: string,
  link: string
): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from("notifications").insert({
      user_id: userId,
      message,
      link,
      read: false,
    })
    if (error) {
      console.warn("[createNotification] insert failed:", error.message)
    }
  } catch (err) {
    console.warn("[createNotification] unexpected error:", err)
  }
}

