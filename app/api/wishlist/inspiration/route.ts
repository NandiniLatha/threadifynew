import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { inspirationId, action } = await req.json()

    if (!inspirationId || (action !== "save" && action !== "unsave")) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
    }

    if (action === "save") {
      const { error } = await supabase
        .from("wishlist_items")
        .insert({
          customer_id: user.id,
          item_type: "inspiration",
          inspiration_id: inspirationId,
        })

      // If error is unique constraint violation, it's already saved, just ignore or return success
      if (error && error.code !== '23505') {
        console.error("Error saving inspiration:", error)
        return NextResponse.json({ error: "Failed to save inspiration" }, { status: 500 })
      }
    } else if (action === "unsave") {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .match({
          customer_id: user.id,
          item_type: "inspiration",
          inspiration_id: inspirationId,
        })

      if (error) {
        console.error("Error removing inspiration:", error)
        return NextResponse.json({ error: "Failed to remove inspiration" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Inspiration toggle error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ savedIds: [] })
    }

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("inspiration_id")
      .eq("customer_id", user.id)
      .eq("item_type", "inspiration")
      .not("inspiration_id", "is", null)

    if (error) {
      console.error("Error fetching inspirations:", error)
      return NextResponse.json({ savedIds: [] })
    }

    const savedIds = data.map(row => row.inspiration_id)
    return NextResponse.json({ savedIds })
  } catch (err) {
    console.error("GET inspirations error:", err)
    return NextResponse.json({ savedIds: [] })
  }
}
