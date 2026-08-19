import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createNotification } from "@/app/api/notifications/helpers"

/**
 * GET /api/consultations
 * Returns consultations for the authenticated user (customer or tailor).
 */
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    // Fetch user role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const isTailor = profile?.role === "tailor"
    const column   = isTailor ? "tailor_id" : "customer_id"

    const { data, error } = await supabase
      .from("consultations")
      .select(`
        *,
        customer:customer_id (id, name),
        tailor:tailor_id   (id, name, tailor_profiles (avg_rating, specialty))
      `)
      .eq(column, user.id)
      .order("date", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ consultations: data || [] })
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 })
  }
}

/**
 * POST /api/consultations
 * Books a consultation (customer-only).
 *
 * Body: { tailor_id, date, time_slot, mode, reason }
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const { tailor_id, date, time_slot, mode, reason } = await request.json()

    if (!tailor_id || !date || !time_slot) {
      return NextResponse.json(
        { error: "tailor_id, date, and time_slot are required." },
        { status: 400 }
      )
    }

    // Check for double booking (same tailor, date, time slot)
    const { data: conflict } = await supabase
      .from("consultations")
      .select("id")
      .eq("tailor_id", tailor_id)
      .eq("date", date)
      .eq("time_slot", time_slot)
      .neq("status", "cancelled")
      .single()

    if (conflict) {
      return NextResponse.json(
        { error: "This time slot is already booked. Please choose another time." },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from("consultations")
      .insert({
        customer_id: user.id,
        tailor_id,
        date,
        time_slot,
        mode:   mode   || "online",
        reason: reason || "",
        status: "pending",
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify the tailor
    await createNotification(
      supabase,
      tailor_id,
      `📅 A customer has booked a consultation with you on ${date} at ${time_slot}.`,
      "/tailor/requests"
    )

    return NextResponse.json({ success: true, consultation: data })
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 })
  }
}

/**
 * PUT /api/consultations
 * Updates consultation status (e.g. tailor confirms/cancels, customer cancels).
 *
 * Body: { id, status }
 */
export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required." }, { status: 400 })
    }

    if (!["confirmed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 })
    }

    // Fetch consultation to verify access
    const { data: consultation } = await supabase
      .from("consultations")
      .select("id, customer_id, tailor_id, date, time_slot")
      .eq("id", id)
      .single()

    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found." }, { status: 404 })
    }

    const isParticipant =
      consultation.customer_id === user.id ||
      consultation.tailor_id === user.id

    if (!isParticipant) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 })
    }

    const { error } = await supabase
      .from("consultations")
      .update({ status })
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send notification to the other party
    const notifyUserId =
      consultation.customer_id === user.id
        ? consultation.tailor_id
        : consultation.customer_id

    const msg =
      status === "confirmed"
        ? `✅ Your consultation on ${consultation.date} at ${consultation.time_slot} has been confirmed.`
        : `❌ Your consultation on ${consultation.date} at ${consultation.time_slot} was cancelled.`

    await createNotification(supabase, notifyUserId, msg, "/dashboard")

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 })
  }
}
