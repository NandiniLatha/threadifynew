import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Configure Cloudinary dynamically inside the request handler
    // This ensures process.env is evaluated at runtime in production, not build time
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
      api_key: process.env.CLOUDINARY_API_KEY || "",
      api_secret: process.env.CLOUDINARY_API_SECRET || "",
    })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to submit design requests." },
        { status: 401 }
      )
    }

    const {
      imageBase64,
      imageUrl: imageUrlFromBody,
      aiTags,
      budgetMin,
      budgetMax,
      deadline,
      notes,
      customization,
      isDraft,
      tailorId,
      draftId,
    } = await request.json()

    // Accept either a base64 data URI (user upload) or a direct URL (inspiration gallery)
    const imageSource = imageBase64 || imageUrlFromBody

    if (!imageSource) {
      return NextResponse.json(
        { error: "Inspiration image is required." },
        { status: 400 }
      )
    }

    // Determine the stored image URL:
    // - If imageSource is already an http(s) URL or a relative path, use it directly (no Cloudinary needed)
    // - If it's a base64 data URI, upload to Cloudinary (or fall back to placeholder)
    const isDirectUrl = imageSource.startsWith("http") || imageSource.startsWith("/")

    let imageUrl = isDirectUrl
      ? imageSource
      : "/images/features/feature_1_ai_scan.webp"

    if (!isDirectUrl && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const uploadRes = await cloudinary.uploader.upload(imageSource, {
          folder: "threadify_inspiration",
        })
        imageUrl = uploadRes.secure_url
      } catch (err: any) {
        console.error("Cloudinary upload error diagnostic:", {
          message: err.message || err,
          http_code: err.http_code,
          name: err.name,
          sourceType: typeof imageSource,
          isBase64: typeof imageSource === "string" && imageSource.startsWith("data:image/"),
          sourceLength: imageSource?.length
        })
        return NextResponse.json(
          { error: "We couldn't store your inspiration image. Please try again." },
          { status: 500 }
        )
      }
    }

    // Combine customization into notes
    let combinedNotes = notes || "";
    if (customization && Object.keys(customization).length > 0) {
      const customString = Object.entries(customization)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
        .join(' | ');
      combinedNotes = combinedNotes ? `[Customization: ${customString}]\n\n${combinedNotes}` : `[Customization: ${customString}]`;
    }

    if (isDraft) {
      // Save in wishlist_items table
      const { error } = await supabase.from("wishlist_items").insert({
        customer_id: user.id,
        image_url: imageUrl,
        ai_tags: aiTags || [],
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        deadline: deadline || null,
        notes: combinedNotes,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Draft saved to wishlist!" })
    } else {
      // Validate required inputs for live submissions
      if (!budgetMin || !budgetMax || !deadline) {
        return NextResponse.json(
          { error: "Budget range and delivery deadline are required for submissions." },
          { status: 400 }
        )
      }

      // Save in design_requests table
      const { error } = await supabase.from("design_requests").insert({
        customer_id: user.id,
        image_url: imageUrl,
        ai_tags: aiTags || [],
        budget_min: parseFloat(budgetMin),
        budget_max: parseFloat(budgetMax),
        deadline: deadline,
        // Direct commission: assign immediately to the chosen tailor
        // General broadcast: leave tailor_id null and open to all bids
        tailor_id: tailorId || null,
        status: tailorId ? "assigned" : "pending_bids",
        notes: combinedNotes,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // If this request originated from a saved draft, clean up the original draft safely
      if (draftId) {
        await supabase
          .from("wishlist_items")
          .delete()
          .match({ id: draftId, customer_id: user.id })
      }

      return NextResponse.json({ success: true, message: "Design request submitted successfully!" })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred during submission."
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

const CANCELLABLE_STATUSES = ["draft", "pending_bids", "quoted", "cancelled"]

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { error: "You must be signed in to delete a design request." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    let requestId = searchParams.get("id")

    if (!requestId) {
      try {
        const body = await request.json()
        requestId = body.id
      } catch {
        // No body supplied
      }
    }

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required." },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 1. Fetch design request to verify existence, ownership, and status
    const { data: designRequest, error: fetchErr } = await supabaseAdmin
      .from("design_requests")
      .select("id, status, customer_id")
      .eq("id", requestId)
      .single()

    if (fetchErr || !designRequest) {
      return NextResponse.json(
        { error: "Design request not found." },
        { status: 404 }
      )
    }

    // 2. Strict Ownership Check
    if (designRequest.customer_id !== user.id) {
      return NextResponse.json(
        { error: "Only the customer who created this request can delete it." },
        { status: 403 }
      )
    }

    // 3. Status Check: Reject deletion if request has progressed into payment/production/order fulfillment
    if (!CANCELLABLE_STATUSES.includes(designRequest.status)) {
      return NextResponse.json(
        { error: "This request can no longer be deleted because it has already progressed." },
        { status: 409 }
      )
    }

    // 4. Payment Safeguard Check
    const { data: paymentRecord } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("order_id", requestId)
      .maybeSingle()

    if (paymentRecord) {
      return NextResponse.json(
        { error: "This request can no longer be deleted because it has an active payment record." },
        { status: 409 }
      )
    }

    // 5. Delete request using admin client
    const { data: deletedRows, error: deleteErr } = await supabaseAdmin
      .from("design_requests")
      .delete()
      .eq("id", requestId)
      .eq("customer_id", user.id)
      .select("id")

    if (deleteErr) {
      console.error("[delete-design-request] Delete error:", deleteErr.message)
      return NextResponse.json(
        { error: "Failed to delete request. Please try again later." },
        { status: 500 }
      )
    }

    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json(
        { error: "Request could not be deleted or was already removed." },
        { status: 404 }
      )
    }

    // 6. Cleanup notifications
    try {
      await supabaseAdmin
        .from("notifications")
        .delete()
        .ilike("link", `%${requestId}%`)
    } catch (notifErr) {
      console.warn("[delete-design-request] Notification cleanup warning:", notifErr)
    }

    return NextResponse.json({
      success: true,
      message: "Request deleted successfully.",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred."
    console.error("[delete-design-request] Unhandled error:", message)
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting the request." },
      { status: 500 }
    )
  }
}

