import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"
import { createAdminClient } from "@/lib/supabase/admin"

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

    // Fetch design request to verify existence and bidding eligibility
    const { data: designRequest } = await supabase
      .from("design_requests")
      .select("customer_id, status, tailor_id")
      .eq("id", requestId)
      .single()

    if (!designRequest) {
      return NextResponse.json({ error: "Design request not found." }, { status: 404 })
    }

    // A tailor can only bid if it's open for bids, or if it was assigned directly to them
    if (designRequest.status !== "pending_bids" && designRequest.tailor_id !== user.id) {
      return NextResponse.json(
        { error: "This request is not open for bidding or assigned to another tailor." },
        { status: 403 }
      )
    }

    // Prevent duplicate active quotes from the same tailor for this request
    const { data: existingQuote, error: existingQuoteErr } = await supabase
      .from("quotations")
      .select("id")
      .eq("tailor_id", user.id)
      .eq("request_id", requestId)
      .in("status", ["pending", "accepted"])
      .maybeSingle()

    if (existingQuoteErr) {
      return NextResponse.json(
        { error: "Failed to verify existing quotations." },
        { status: 500 }
      )
    }

    if (existingQuote) {
      return NextResponse.json(
        { error: "You have already submitted a quotation for this request." },
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
