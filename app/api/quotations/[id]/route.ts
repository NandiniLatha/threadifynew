import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quotationId = params.id
    const { price, estimatedDays, note } = await request.json()

    if (!price || !estimatedDays) {
      return NextResponse.json({ error: "Price and estimated days are required." }, { status: 400 })
    }

    // Check ownership and current status
    const { data: quotation, error: fetchErr } = await supabase
      .from("quotations")
      .select("id, tailor_id, status")
      .eq("id", quotationId)
      .single()

    if (fetchErr || !quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    if (quotation.tailor_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own quotations." }, { status: 403 })
    }

    if (quotation.status !== "pending") {
      return NextResponse.json({ error: `Cannot edit a quotation that is already ${quotation.status}.` }, { status: 400 })
    }

    // Update
    const { error: updateErr } = await supabase
      .from("quotations")
      .update({
        price: parseFloat(price),
        estimated_days: parseInt(estimatedDays),
        note: note || "",
      })
      .eq("id", quotationId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "An error occurred." }, { status: 500 })
  }
}
