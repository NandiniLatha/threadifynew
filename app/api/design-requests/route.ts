import { createClient } from "@/lib/supabase/server"
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
    // - If imageSource is already an http(s) URL, use it directly (no Cloudinary needed)
    // - If it's a base64 data URI, upload to Cloudinary (or fall back to placeholder)
    const isExternalUrl = imageSource.startsWith("http")

    let imageUrl = isExternalUrl
      ? imageSource
      : "/images/features/feature_1_ai_scan.webp"

    if (!isExternalUrl && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
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
