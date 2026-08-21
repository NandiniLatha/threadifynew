import { createClient } from "@/lib/supabase/server"
import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})

export async function POST(request: Request) {
  try {
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
      isDraft,
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
      : "/images/features/feature_1_ai_scan.jpg"

    if (!isExternalUrl && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const uploadRes = await cloudinary.uploader.upload(imageSource, {
          folder: "threadify_inspiration",
        })
        imageUrl = uploadRes.secure_url
      } catch (err) {
        console.error("Cloudinary upload error:", err)
        return NextResponse.json(
          { error: "We couldn't store your inspiration image. Please try again." },
          { status: 500 }
        )
      }
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
        notes: notes || "",
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
        status: "pending_bids",
        notes: notes || "",
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
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
