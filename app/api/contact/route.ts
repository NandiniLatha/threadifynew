import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      )
    }

    // Store contact submission to Supabase
    // To also send email: wire up a transactional email provider (Resend, SendGrid)
    // and call their API here using process.env.CONTACT_EMAIL as the recipient.
    const supabase = createClient()
    const { error } = await supabase.from("contact_submissions").insert({
      name,
      email,
      subject,
      message,
    })

    if (error) {
      // Log but don't expose DB errors to the user
      console.error("[contact] DB insert error:", error.message)
      return NextResponse.json(
        { error: "Failed to send your message. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! We will get back to you within 24 hours.",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
