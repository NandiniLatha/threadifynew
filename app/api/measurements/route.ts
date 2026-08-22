import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/measurements
 * Returns all measurements belonging to the authenticated user.
 */
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("measurements")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ measurements: data || [] })
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 })
  }
}

/**
 * POST /api/measurements
 * Creates a new measurement profile for the authenticated user.
 *
 * Body:
 * {
 *   label: string,              -- e.g. "My Blouse Measurements"
 *   garment_type: string,       -- "blouse" | "shirt" | "dress" | "general"
 *   size?: string | null,       -- "XS" | "S" | "M" | "L" | "XL" | "XXL"
 *   measurement_source?: string,-- "custom" | "standard" | "standard_adjusted"
 *   chest?: number,
 *   waist?: number,
 *   hips?: number,
 *   shoulder?: number,
 *   sleeve_length?: number,
 *   inseam?: number,
 *   neck?: number,
 *   height?: number,
 *   weight?: number,
 *   custom?: Record<string, unknown>, -- garment-specific custom fields
 *   is_default?: boolean
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const body = await request.json()
    const {
      label,
      garment_type,
      size,
      measurement_source,
      chest,
      waist,
      hips,
      shoulder,
      sleeve_length,
      inseam,
      neck,
      height,
      weight,
      custom,
      is_default,
    } = body

    if (!label) {
      return NextResponse.json({ error: "A label is required for the measurement profile." }, { status: 400 })
    }

    // If this is the new default, unset any existing defaults
    if (is_default) {
      await supabase
        .from("measurements")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true)
    }

    const { data, error } = await supabase
      .from("measurements")
      .insert({
        user_id: user.id,
        label,
        chest:         chest         ? Number(chest)         : null,
        waist:         waist         ? Number(waist)         : null,
        hips:          hips          ? Number(hips)          : null,
        shoulder:      shoulder      ? Number(shoulder)      : null,
        sleeve_length: sleeve_length ? Number(sleeve_length) : null,
        inseam:        inseam        ? Number(inseam)        : null,
        neck:          neck          ? Number(neck)          : null,
        height:        height        ? Number(height)        : null,
        weight:        weight        ? Number(weight)        : null,
        custom: {
          garment_type: garment_type || "general",
          size: size || null,
          measurement_source: measurement_source || "custom",
          ...(custom || {}),
        },
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, measurement: data })
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 })
  }
}

/**
 * PUT /api/measurements
 * Updates an existing measurement profile.
 *
 * Body: { id: string, ...same fields as POST }
 */
export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const body = await request.json()
    const { id, is_default, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: "Measurement ID is required." }, { status: 400 })
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("measurements")
      .select("id, custom")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Measurement profile not found." }, { status: 404 })
    }

    // If setting as default, clear others
    if (is_default) {
      await supabase
        .from("measurements")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true)
    }

    const updates: Record<string, unknown> = { is_default: is_default ?? false }
    const numericFields = ["chest", "waist", "hips", "shoulder", "sleeve_length", "inseam", "neck", "height", "weight"]
    for (const f of numericFields) {
      if (fields[f] !== undefined) updates[f] = fields[f] ? Number(fields[f]) : null
    }
    if (fields.label) updates.label = fields.label

    const existingCustom = (existing.custom || {}) as Record<string, unknown>
    const incomingCustom = (fields.custom || {}) as Record<string, unknown>

    updates.custom = {
      ...existingCustom,
      ...incomingCustom,
      garment_type: fields.garment_type || incomingCustom.garment_type || existingCustom.garment_type || "general",
      size: fields.size !== undefined ? fields.size : (incomingCustom.size ?? existingCustom.size ?? null),
      measurement_source: fields.measurement_source || incomingCustom.measurement_source || existingCustom.measurement_source || "custom",
    }

    const { data, error } = await supabase
      .from("measurements")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, measurement: data })
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 })
  }
}

/**
 * DELETE /api/measurements
 * Deletes a measurement profile.
 *
 * Body: { id: string }
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Measurement ID is required." }, { status: 400 })
    }

    const { error } = await supabase
      .from("measurements")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 })
  }
}
