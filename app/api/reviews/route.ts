import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to submit reviews." },
        { status: 401 }
      )
    }

    const { orderId, rating, comment } = await request.json()

    if (!orderId || !rating) {
      return NextResponse.json(
        { error: "Order reference ID and a rating (1-5) are required." },
        { status: 400 }
      )
    }

    const numericRating = Number(rating)
    if (numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5." },
        { status: 400 }
      )
    }

    // Insert review row
    const { error: reviewErr } = await supabase.from("reviews").insert({
      order_id: orderId,
      rating: numericRating,
      comment: comment || "",
    })

    if (reviewErr) {
      return NextResponse.json({ error: reviewErr.message }, { status: 500 })
    }

    // Update the design request status to 'reviewed'
    await supabase
      .from("design_requests")
      .update({ status: "reviewed" })
      .eq("id", orderId)

    // Query tailor assigned to this design request to send notification
    const { data: reqData } = await supabase
      .from("design_requests")
      .select("tailor_id")
      .eq("id", orderId)
      .single()

    if (reqData?.tailor_id) {
      // Notify the tailor about the new review
      const stars = "★".repeat(numericRating) + "☆".repeat(5 - numericRating)
      await createNotification(
        supabase,
        reqData.tailor_id,
        `A customer left you a ${stars} review! Thank you for your craftsmanship.`,
        "/tailor/portfolio"
      )
    }

    return NextResponse.json({ success: true, message: "Review posted successfully!" })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record review."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
