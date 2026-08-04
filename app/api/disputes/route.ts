import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to submit disputes." },
        { status: 401 }
      )
    }

    const { orderId, reason } = await request.json()

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: "Order reference ID and a dispute reason are required." },
        { status: 400 }
      )
    }

    // Insert dispute
    const { error } = await supabase.from("disputes").insert({
      order_id: orderId,
      raised_by: user.id,
      reason: reason,
      status: "open",
      admin_notes: "",
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Dispute raised successfully!" })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to record dispute."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
