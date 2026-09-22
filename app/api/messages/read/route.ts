import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    }

    // Create admin client for privileged conversation status update
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    const adminSupabase = serviceRoleKey && supabaseUrl
      ? createAdminClient(supabaseUrl, serviceRoleKey)
      : supabase

    // Fetch conversation to determine role and verify authorization securely
    const { data: conv, error: convError } = await adminSupabase
      .from("conversations")
      .select("customer_id, tailor_id, customer_unread, tailor_unread")
      .eq("order_id", orderId)
      .single()

    if (convError || !conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Strict ownership verification: user MUST be customer or tailor of this conversation
    if (user.id !== conv.customer_id && user.id !== conv.tailor_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const isCustomer = user.id === conv.customer_id
    const field = isCustomer ? "customer_unread" : "tailor_unread"
    const currentUnread = isCustomer ? conv.customer_unread : conv.tailor_unread

    // Avoid unnecessary DB updates if unread count is already 0
    if (currentUnread === 0) {
      return NextResponse.json({ success: true, updated: false })
    }

    const { error: updateError } = await adminSupabase
      .from("conversations")
      .update({ [field]: 0 })
      .eq("order_id", orderId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}
