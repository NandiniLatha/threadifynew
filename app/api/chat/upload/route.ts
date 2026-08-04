/**
 * Threadify AI — Image Upload Route
 * Accepts an image file, uploads to Supabase Storage (ai-attachments bucket),
 * returns a public URL for gpt-4o vision analysis.
 */

import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const userId = formData.get("userId") as string | null

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return Response.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Only JPEG, PNG, WebP, and GIF images are supported" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `${userId || "guest"}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from("ai-attachments")
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      // If bucket doesn't exist yet, return a placeholder URL so the UI still works
      console.warn("[/api/chat/upload] Storage error:", uploadError.message)
      // Return a data URL as fallback for local dev
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      return Response.json({ url: `data:${file.type};base64,${base64}` })
    }

    const { data: publicUrlData } = supabase.storage
      .from("ai-attachments")
      .getPublicUrl(fileName)

    return Response.json({ url: publicUrlData.publicUrl })
  } catch (err) {
    console.error("[/api/chat/upload]", err)
    return Response.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
