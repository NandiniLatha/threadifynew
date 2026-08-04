import { createClient } from "@supabase/supabase-js"
import { ROUTE_WHITELIST, getRoutesForRole } from "@/lib/ai/whitelist"
import { PLATFORM_KNOWLEDGE } from "@/lib/ai/knowledge"
import { streamText, tool } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import OpenAI from "openai"

export const runtime = "edge"

// ── OpenAI client for moderation ─────────────────────────────────────────────
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ── In-memory rate limiter (edge-safe) ───────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 20) return false
  entry.count++
  return true
}

// ── Page → route ID mapping for tools ────────────────────────────────────────
const PAGE_TO_ROUTE: Record<string, string> = {
  orders: "customer-orders",
  payments: "customer-payments",
  portfolio: "tailor-portfolio",
  wishlist: "customer-wishlist",
  quotations: "tailor-quotations",
  profile: "customer-settings",
  settings: "customer-settings",
  messages: "customer-messages",
  "design-studio": "design-studio",
  explore: "explore-tailors",
  requests: "customer-requests",
  notifications: "customer-notifications",
  "admin-verification": "admin-verification",
  "admin-orders": "admin-orders",
  "admin-disputes": "admin-disputes",
}

const UPLOAD_TYPE_TO_ROUTE: Record<string, string> = {
  portfolio: "tailor-portfolio",
  inspiration: "design-studio",
  measurements: "customer-settings",
}

// ── Tool definitions (AI SDK format) ──────────────────────────────────────────
const TOOLS = {
  navigate_to_page: tool({
    description: "Navigate the user to a specific page in the Threadify application. Use this when the user explicitly asks to go somewhere or when a direct action would help them more than a text answer.",
    parameters: z.object({
      page: z.enum([
        "orders", "payments", "portfolio", "wishlist", "quotations", "profile", "settings",
        "messages", "design-studio", "explore", "requests", "notifications",
        "admin-verification", "admin-orders", "admin-disputes"
      ] as const),
      direct: z.boolean().describe("Set to true only when the user gives an explicit direct navigation command like 'take me to orders'. False when suggesting navigation."),
      label: z.string().describe("Human-readable label for the navigation button, e.g. 'Open My Orders'")
    }),
    execute: async ({ page, direct, label }: { page: string; direct: boolean; label: string }) => {
      const routeId = PAGE_TO_ROUTE[page] || "customer-overview"
      const route = ROUTE_WHITELIST[routeId]
      return {
        type: "navigation",
        routeId,
        path: route?.path || "/",
        label: label || route?.label || `Go to ${page}`,
        direct,
      }
    }
  }),
  track_order: tool({
    description: "Navigate the user to their orders page to track production status.",
    parameters: z.object({
      order_id: z.string().optional().describe("Optional order ID if the user mentioned a specific order")
    }),
    execute: async () => ({
      type: "navigation",
      routeId: "customer-orders",
      path: "/dashboard/orders",
      label: "Track My Orders",
      direct: false,
    })
  }),
  get_payment_status: tool({
    description: "Navigate the user to their payments and escrow page to check payment or refund status.",
    parameters: z.object({}),
    execute: async () => ({
      type: "navigation",
      routeId: "customer-payments",
      path: "/dashboard/payments",
      label: "View Payments & Escrow",
      direct: false,
    })
  }),
  open_upload_flow: tool({
    description: "Navigate the user to the correct page to upload content. Use when the user wants to upload portfolio images, inspiration photos, or manage their measurements.",
    parameters: z.object({
      type: z.enum(["portfolio", "inspiration", "measurements"] as const).describe("The type of upload flow to open"),
      label: z.string().describe("Human-readable label for the action button")
    }),
    execute: async ({ type, label }: any) => {
      const routeId = UPLOAD_TYPE_TO_ROUTE[type] || "design-studio"
      const route = ROUTE_WHITELIST[routeId]
      return {
        type: "navigation",
        routeId,
        path: route?.path || "/design-studio",
        label: label || `Upload ${type}`,
        direct: false,
      }
    }
  }),
  compare_quotations: tool({
    description: "Navigate the user to compare quotations/bids they have received for a design request.",
    parameters: z.object({
      order_id: z.string().optional().describe("Optional order or request ID to navigate to directly")
    }),
    execute: async () => ({
      type: "navigation",
      routeId: "customer-requests",
      path: "/dashboard/requests",
      label: "Compare My Quotations",
      direct: false,
    })
  })
}

// ── System prompt builder ─────────────────────────────────────────────────────
function buildSystemPrompt(role: string, currentPage: string, knowledgeContext: string): string {
  return `You are Threadify AI, the official AI Copilot of Threadify — a premium custom fashion marketplace connecting customers with verified master tailors across India.

You help ${role === "customer" ? "customers" : role === "tailor" ? "master tailors" : role === "admin" ? "platform administrators" : "guests"} use every feature of Threadify. You have access to tools to navigate the app — use them to guide users directly when appropriate.

**Current context:**
- User role: ${role}
- Current page: ${currentPage}

**Rules:**
- Never invent features that don't exist in Threadify. If unsure, say so honestly.
- Match your tone to the user's role:
  - Customer: warm, encouraging, step-by-step guidance
  - Tailor: practical, business-focused, concise
  - Admin: professional, direct
  - Guest: welcoming, informative, guide them to sign up
- Use rich formatting: **bold**, bullet lists, numbered steps. Keep responses concise by default.
- Prefer offering a navigation action button over a long text explanation when a direct action exists.
- When the user says "take me to X" or "go to X" or "open X", use navigate_to_page with direct: true.
- When suggesting navigation (not an explicit command), use direct: false.
- Ground your answers in the platform knowledge provided below.

**Platform Knowledge:**
${knowledgeContext}

**Available navigation pages for this user:**
${getRoutesForRole(role as "customer" | "tailor" | "admin")
  .map((r) => `- ${r.id}: ${r.label} (${r.path})`)
  .join("\n")}`
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, data } = body

    const role: string = data?.role || "customer"
    const currentPage: string = data?.currentPage || "/"
    const userId: string = data?.userId || "guest"
    const hasImage: boolean = data?.hasImage === true

    // Rate limiting
    if (userId !== "guest" && !checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before sending more messages." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      )
    }

    // Extract last user message for moderation
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user")
    const userText = typeof lastUserMsg?.content === "string"
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg?.content)
        ? lastUserMsg.content.find((c: { type: string }) => c.type === "text")?.text || ""
        : ""

    // Moderation check (non-blocking if it fails, but we log)
    if (userText && process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-your")) {
      try {
        const modResult = await openaiClient.moderations.create({ input: userText })
        if (modResult.results[0]?.flagged) {
          return new Response(
            JSON.stringify({ error: "Your message was flagged by our content moderation system." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        }
      } catch {
        // Moderation is best-effort — continue if it fails
      }
    }

    // Build knowledge context from local knowledge base
    const knowledgeContext = PLATFORM_KNOWLEDGE
      .filter((k) => k.roles.includes(role as "customer" | "tailor" | "admin") || k.roles.includes("customer"))
      .slice(0, 5)
      .map((k) => `### ${k.title}\n${k.content}`)
      .join("\n\n")

    // Trim to last 15 turns
    const trimmedMessages = messages.slice(-15)

    // Choose model: gpt-4o for images, gpt-4o-mini for text
    const model = hasImage ? "gpt-4o" : "gpt-4o-mini"
    const systemPrompt = buildSystemPrompt(role,  knowledgeContext)

    // If no real API key, use mock fallback
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-your")) {
      return mockStreamingResponse(userText, role, currentPage)
    }

    // Real OpenAI streaming call using Vercel AI SDK v3/v4 format
    const result = streamText({
      model: openai(model),
      system: systemPrompt,
      messages: trimmedMessages,
      maxTokens: 800,
      temperature: 0.7,
      tools: TOOLS,
      maxSteps: 2, // allows it to execute a tool and then send a follow-up response
      onFinish: async ({ text }) => {
        // Fire-and-forget: persist to Supabase if we have a conversationId and userId
        const conversationId = data?.conversationId
        if (!conversationId || userId === "guest") return

        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          // Upsert assistant message
          await supabase.from("ai_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: text,
          })
        } catch {
          // Non-critical — don't break the stream
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error("[/api/chat] Error:", err)
    return new Response(
      JSON.stringify({ error: "Failed to process your request. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// ── Mock streaming fallback (when OPENAI_API_KEY not configured) ───────────────
function mockStreamingResponse(query: string, role: string, currentPage: string): Response {
  const q = query.toLowerCase()

  let content = ""
  let navData: Record<string, unknown> | null = null

  if (q.includes("order") || q.includes("track")) {
    content =
      "You can **track all your active orders** from the Orders dashboard. Each order shows its current production stage — Paid, In Production, Shipped, or Delivered — updated in real-time by your tailor."
    navData = { type: "navigation", routeId: "customer-orders", path: "/dashboard/orders", label: "Track My Orders", direct: false }
  } else if (q.includes("payment") || q.includes("escrow") || q.includes("pay")) {
    content =
      "Threadify uses **Razorpay Escrow** to protect every transaction. Your payment is held securely and only released to the tailor after you confirm delivery. Visit your Payments page to view receipts and escrow status."
    navData = { type: "navigation", routeId: "customer-payments", path: "/dashboard/payments", label: "View Payments & Escrow", direct: false }
  } else if (q.includes("portfolio") || q.includes("upload")) {
    content =
      "Tailors can build a **stunning portfolio** by uploading high-resolution photos of completed garments. Profiles with 10+ portfolio images receive **3× more bid acceptances**!"
    navData = { type: "navigation", routeId: "tailor-portfolio", path: "/tailor/portfolio", label: "Open Portfolio", direct: false }
  } else if (q.includes("measure") || q.includes("size") || q.includes("fit")) {
    content =
      "You can save your **body measurements** (chest, waist, hips, shoulder, sleeve length, inseam) in your Account Settings. Tailors reference these when crafting your custom garment for a perfect fit."
    navData = { type: "navigation", routeId: "customer-settings", path: "/dashboard/settings", label: "Manage Measurements", direct: false }
  } else if (q.includes("quote") || q.includes("bid") || q.includes("quotation")) {
    content =
      "Once you submit a design request, verified tailors will send you **price quotes** with their rates, estimated timeline, and a personal note. You can compare quotes and accept the best fit."
    navData = { type: "navigation", routeId: "customer-requests", path: "/dashboard/requests", label: "View My Quotations", direct: false }
  } else if (q.includes("tailor") || q.includes("find") || q.includes("explore")) {
    content =
      "Browse our curated marketplace of **verified master tailors** — filter by specialty (Bridal, Ethnic, Luxury Couture, Mens Suits), location, ratings, and review their portfolio galleries."
    navData = { type: "navigation", routeId: "explore-tailors", path: "/explore", label: "Explore Tailors", direct: false }
  } else if (q.includes("design") || q.includes("create") || q.includes("inspiration")) {
    content =
      "Ready to create something unique? Upload your **inspiration photo or sketch** in the Design Studio. Add your budget, deadline, and fabric preferences — then verified tailors will submit their quotes!"
    navData = { type: "navigation", routeId: "design-studio", path: "/design-studio", label: "Open Design Studio", direct: false }
  } else if (q.includes("wish") || q.includes("save") || q.includes("bookmark")) {
    content =
      "Your **Wishlist** stores saved tailor profiles and bookmarked garment inspirations. Visit your wishlist to revisit saved designs and tailors before placing an order."
    navData = { type: "navigation", routeId: "customer-wishlist", path: "/dashboard/wishlist", label: "Open Wishlist", direct: false }
  } else if (q.includes("message") || q.includes("chat") || q.includes("contact")) {
    content =
      "You can **message your tailor directly** through the Threadify Messages inbox once a request is assigned. All communication is tracked on-platform for your protection."
    navData = { type: "navigation", routeId: "customer-messages", path: "/dashboard/messages", label: "Open Messages", direct: false }
  } else if (q.includes("verified") || q.includes("verification") || q.includes("badge")) {
    content =
      "**Verified tailors** have passed Threadify's credential review — including business registration, skill assessment, and portfolio quality check. The verified badge builds customer trust and increases bid acceptance rates significantly."
    navData = { type: "navigation", routeId: "tailor-settings", path: "/tailor/settings", label: "Verification Settings", direct: false }
  } else {
    const roleDefault = role === "tailor"
      ? "Browse open client requests to submit bids, manage your active orders, and grow your portfolio showcase."
      : "Upload your fashion inspiration, receive quotes from verified tailors, and track your custom garment orders."
    content = `I'm **Threadify AI**, your personal assistant! I can help you with:\n\n- 🎨 Custom design requests\n- 📦 Tracking orders\n- 💳 Payments & escrow\n- 📏 Body measurements\n- 🧵 Finding the right tailor\n- 💬 Messaging tailors\n\n${roleDefault}\n\nWhat would you like to know?`
  }

  const stream = new ReadableStream({
    async start(controller) {
      const words = content.split(" ")
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? " " : "")
        controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(chunk)}\n`))
        await new Promise((r) => setTimeout(r, 22))
      }
      if (navData) {
        controller.enqueue(new TextEncoder().encode(`2:${JSON.stringify([navData] as [string, ...string[]])}\n`))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-data-stream": "v1",
    },
  })
}
