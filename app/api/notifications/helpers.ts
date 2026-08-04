import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a notification row for a given user.
 * Silently fails (logs warning) so it never breaks the primary request.
 */
export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  message: string,
  link: string
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
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
