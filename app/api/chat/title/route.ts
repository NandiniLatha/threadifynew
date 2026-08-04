/**
 * Auto-title a conversation after the first AI reply.
 * Uses gpt-4o-mini with max_tokens=10 for cost efficiency.
 */

import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { userMessage, assistantReply, conversationId, userId } = await req.json()

    if (!conversationId || !userId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    let title = "New Chat"

    // Only call OpenAI if key is configured
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-your")) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 12,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Generate a concise 3-5 word title for this conversation. Return ONLY the title, no punctuation.",
          },
          {
            role: "user",
            content: `User: ${userMessage}\nAssistant: ${assistantReply}`,
          },
        ],
      })
      title = completion.choices[0]?.message?.content?.trim() || title
    } else {
      // Mock title from user message
      const words = userMessage.split(" ").slice(0, 4).join(" ")
      title = words.length > 3 ? words + "…" : words
    }

    // Update conversation title in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from("ai_conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", userId)

    if (error) throw error

    return Response.json({ title })
  } catch (err) {
    console.error("[/api/chat/title]", err)
    return Response.json({ error: "Failed to generate title" }, { status: 500 })
  }
}
