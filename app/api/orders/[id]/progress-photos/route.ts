import { createClient } from "@/lib/supabase/server"
import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key:    process.env.CLOUDINARY_API_KEY    || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/orders/[id]/progress-photos
 *
 * Returns all tailor-uploaded progress photos for a given order.
 * Only accessible by the order's customer or the assigned tailor.
 * `is_primary = false` selects progress photos only — the customer's original
 * inspiration image lives in design_requests.image_url, not here.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const orderId = params.id

    // Verify the caller is the customer or the assigned tailor for this order.
    // The RLS policies on design_request_images also enforce this at the DB
    // layer, but we add an explicit check here to return a clear 403 rather
    // than an empty array when the caller has no access.
    const { data: orderRow, error: orderErr } = await supabase
      .from("design_requests")
      .select("id, customer_id, tailor_id")
      .eq("id", orderId)
      .single()

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    const isCaller =
      orderRow.customer_id === user.id || orderRow.tailor_id === user.id

    if (!isCaller) {
      return NextResponse.json(
        { error: "You do not have access to this order's progress photos." },
        { status: 403 }
      )
    }

    // Fetch non-primary images (progress photos) ordered by upload sequence
    const { data: photos, error: photosErr } = await supabase
      .from("design_request_images")
      .select("id, image_url, sort_order, created_at, uploaded_by, production_stage")
      .eq("request_id", orderId)
      .eq("is_primary", false)
      .order("sort_order", { ascending: true })

    if (photosErr) {
      return NextResponse.json({ error: photosErr.message }, { status: 500 })
    }

    return NextResponse.json({ photos: photos ?? [] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * POST /api/orders/[id]/progress-photos
 *
 * Called by the assigned tailor to upload a production-progress photo.
 * Body: { imageBase64: string }
 *
 * - Verifies tailor ownership of the order.
 * - Uploads the image to Cloudinary (falls back to a placeholder if
 *   Cloudinary is not configured in the environment).
 * - Inserts a row into design_request_images with:
 *     is_primary  = false   (progress photo, not the customer's inspiration)
 *     uploaded_by = tailor's user ID
 *     sort_order  = current count + 1
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const orderId = params.id
    const { imageBase64, stage } = await request.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required." },
        { status: 400 }
      )
    }

    // Validate that if stage is provided, it's one of the production stages
    const validStages = ["cutting", "stitching", "quality_check", "ready"]
    const productionStage = validStages.includes(stage) ? stage : null

    // Verify the caller is the assigned tailor for this order
    const { data: orderRow, error: orderErr } = await supabase
      .from("design_requests")
      .select("id, tailor_id, status")
      .eq("id", orderId)
      .single()

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    if (orderRow.tailor_id !== user.id) {
      return NextResponse.json(
        { error: "Only the assigned tailor can upload progress photos." },
        { status: 403 }
      )
    }

    // Determine the next sort_order by counting existing progress photos
    const { count } = await supabase
      .from("design_request_images")
      .select("*", { count: "exact", head: true })
      .eq("request_id", orderId)
      .eq("is_primary", false)

    const nextSortOrder = (count ?? 0) + 1

    // Upload to Cloudinary or fall back to a local placeholder
    let imageUrl = "/images/features/feature_1_ai_scan.webp"

    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        const uploadRes = await cloudinary.uploader.upload(imageBase64, {
          folder: "threadify_progress",
        })
        imageUrl = uploadRes.secure_url
      } catch (uploadErr) {
        console.error("[progress-photos] Cloudinary upload error:", uploadErr)
        return NextResponse.json(
          { error: "Could not upload image. Please try again." },
          { status: 500 }
        )
      }
    }

    // Insert into design_request_images
    // The RLS policy "dri: tailor insert progress photos" enforces that
    // uploaded_by === auth.uid() and tailor_id === auth.uid() at the DB layer.
    const { data: newPhoto, error: insertErr } = await supabase
      .from("design_request_images")
      .insert({
        request_id:  orderId,
        image_url:   imageUrl,
        is_primary:  false,
        sort_order:  nextSortOrder,
        uploaded_by: user.id,
        production_stage: productionStage,
      })
      .select("id, image_url, sort_order, created_at, uploaded_by, production_stage")
      .single()

    if (insertErr) {
      console.error("[progress-photos] insert error:", insertErr.message)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    if (productionStage) {
      if (orderRow.status === productionStage) {
        const supabaseAdmin = createAdminClient()
        
        // Advance evidence status to waiting_for_customer_approval
        const { error: updateErr } = await supabaseAdmin
          .from("design_requests")
          .update({ production_evidence_status: "waiting_for_customer_approval" })
          .eq("id", orderId)

        if (updateErr) {
          console.error("[progress-photos] evidence status update error:", updateErr.message)
        }
      } else {
        console.warn(`[progress-photos] evidence status not updated: order status is '${orderRow.status}', expected '${productionStage}'`)
      }
    }

    return NextResponse.json({ success: true, photo: newPhoto })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error."
    console.error("[progress-photos] unhandled error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
