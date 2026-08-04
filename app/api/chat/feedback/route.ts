/**
 * Threadify AI — Message Feedback Route
 * Writes 'up' | 'down' | null to ai_messages.feedback via service role key.
 */

import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { messageId, conversationId, userId, feedback } = await req.json()

    if (!messageId || !userId || !conversationId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (feedback !== "up" && feedback !== "down" && feedback !== null) {
      return Response.json({ error: "Invalid feedback value" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify ownership before updating
    const { data: conv } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single()

    if (!conv) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from("ai_messages")
      .update({ feedback })
      .eq("id", messageId)
      .eq("conversation_id", conversationId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    console.error("[/api/chat/feedback]", err)
    return Response.json({ error: "Failed to save feedback" }, { status: 500 })
  }
}
