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
        { error: "You must be signed in to send messages." },
        { status: 401 }
      )
    }

    const { orderId, content, attachmentBase64 } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      )
    }

    let attachmentUrl = null

    if (attachmentBase64) {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        try {
          const uploadRes = await cloudinary.uploader.upload(attachmentBase64, {
            folder: "threadify_messages",
          })
          attachmentUrl = uploadRes.secure_url
        } catch (err) {
          console.error("Cloudinary upload error:", err)
          return NextResponse.json(
            { error: "We couldn't upload your attachment. Please try again." },
            { status: 500 }
          )
        }
      } else {
        // Fallback for demo environments without Cloudinary setup
        attachmentUrl = "/images/features/feature_4_chat.webp"
      }
    }

    const { data, error } = await supabase.from("messages").insert({
      order_id: orderId,
      sender_id: user.id,
      content: content || "Sent an attachment",
      attachment_url: attachmentUrl,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred."
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
