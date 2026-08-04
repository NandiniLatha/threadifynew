import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Lightweight endpoint: returns only the unread notification count.
// Used by the dashboard sidebar to show a badge without fetching all notification payloads.
// Invalidation: any read/new-notification action triggers a re-fetch via the sidebar's useEffect.
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ count: 0 }, { status: 401 })
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)

    if (error) {
      return NextResponse.json({ count: 0 }, { status: 500 })
    }

    return NextResponse.json({ count: count ?? 0 })
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}
