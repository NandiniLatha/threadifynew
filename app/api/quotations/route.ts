import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to submit quotations." },
        { status: 401 }
      )
    }

    // Verify user is a tailor
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "tailor") {
      return NextResponse.json(
        { error: "Only verified tailors can submit quotations." },
        { status: 403 }
      )
    }

    const { requestId, price, estimatedDays, note } = await request.json()

    if (!requestId || !price || !estimatedDays) {
      return NextResponse.json(
        { error: "Request ID, quotation price, and estimated delivery days are required." },
        { status: 400 }
      )
    }

    const { error } = await supabase.from("quotations").insert({
      request_id: requestId,
      tailor_id: user.id,
      price: parseFloat(price),
      estimated_days: parseInt(estimatedDays),
      note: note || "",
      status: "pending",
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fire notification to the customer who owns this design request
    const { data: designRequest } = await supabase
      .from("design_requests")
      .select("customer_id")
      .eq("id", requestId)
      .single()

    if (designRequest?.customer_id) {
      await createNotification(
        supabase,
        designRequest.customer_id,
        "A tailor submitted a quotation for your design request!",
        `/dashboard/orders/${requestId}`
      )
    }

    return NextResponse.json({ success: true, message: "Price Quote submitted successfully!" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
