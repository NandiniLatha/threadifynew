import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ count: 0 }, { status: 401 })
    }

    const { count, error } = await supabase
      .from("wishlist_items")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", user.id)

    if (error) {
      console.error("Error fetching wishlist count:", error)
      return NextResponse.json({ count: 0 }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (err) {
    console.error("Wishlist count error:", err)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}
