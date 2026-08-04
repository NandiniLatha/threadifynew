/**
 * Threadify AI Assistant — Provider-Agnostic Interface
 *
 * All AI interactions go through this clean abstraction.
 * Swapping LLM models or providers (Gemini, OpenAI, Claude) will NEVER touch UI code.
 */

import { getRelevantKnowledge } from "./knowledge"
import { getRoutesForRole, isRouteAllowed, ROUTE_WHITELIST } from "./whitelist"

export type Role = "customer" | "tailor" | "admin"

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  suggestedRouteId?: string
  suggestedRouteLabel?: string
}

export interface AIContext {
  role: Role
  currentPage: string
  currentOrderId?: string
  currentTailorId?: string
}

export interface AIServiceResponse {
  content: string
  suggestedRouteId?: string
  suggestedRouteLabel?: string
}

/**
 * System prompt definition
 */
export const SYSTEM_PROMPT = `
You are Threadify AI, the official intelligent assistant for the Threadify custom fashion marketplace platform.
Answer clearly, concisely, and ONLY about Threadify's actual features using the provided platform context.
If a user question is outside Threadify's scope, politely state that you can only assist with Threadify fashion marketplace features — never invent fake features, prices, or policies.
`

/**
 * Phase 1 Mock Provider Response Generator
 * Generates role-aware, context-aware responses with whitelist navigation actions.
 * Connected to live LLM streaming endpoint in Phase 2.
 */
export async function generateAssistantResponse(
  userQuery: string,
  context: AIContext
): Promise<AIServiceResponse> {
  // Simulate network latency (300ms)
  await new Promise((resolve) => setTimeout(resolve, 350))

  const query = userQuery.toLowerCase()
  const relevantKnowledge = getRelevantKnowledge(userQuery, context.role)
  const allowedRoutes = getRoutesForRole(context.role)

  // 1. Navigation / Route specific query check
  if (query.includes("order") || query.includes("request") || query.includes("track")) {
    if (context.role === "customer") {
      return {
        content: `You can track all your active custom garment requests and orders directly from your customer dashboard. Once a tailor accepts your request, you can monitor production stages (In Production, Shipped, Delivered) in real-time.`,
        suggestedRouteId: "customer-orders",
        suggestedRouteLabel: "Open My Orders",
      }
    } else {
      return {
        content: `You can view all client orders currently in production from your **Active Orders** page. Update order statuses to notify clients as you complete stitching milestones.`,
        suggestedRouteId: "tailor-orders",
        suggestedRouteLabel: "Open Active Orders",
      }
    }
  }

  if (query.includes("design") || query.includes("create") || query.includes("stitch") || query.includes("new")) {
    if (context.role === "customer") {
      return {
        content: `Ready to bring your fashion vision to life? You can upload an inspiration photo or sketch in our **Design Studio**. Verified tailors will review your design and send custom price quotes!`,
        suggestedRouteId: "design-studio",
        suggestedRouteLabel: "Open Design Studio",
      }
    }
  }

  if (query.includes("bid") || query.includes("quote") || query.includes("price")) {
    if (context.role === "tailor") {
      return {
        content: `Browse open customer requests in the **Client Requests** marketplace to submit your competitive price quotes (in ₹ INR), production timelines, and personal notes.`,
        suggestedRouteId: "tailor-requests",
        suggestedRouteLabel: "View Open Client Requests",
      }
    }
  }

  if (query.includes("pay") || query.includes("escrow") || query.includes("bank") || query.includes("money")) {
    if (context.role === "customer") {
      return {
        content: `All payments on Threadify are protected by **Razorpay Escrow**. Funds are held securely when you accept a bid and are only released to the tailor after you confirm successful delivery.`,
        suggestedRouteId: "customer-payments",
        suggestedRouteLabel: "View Payments & Escrow",
      }
    } else {
      return {
        content: `Payouts are automatically transferred to your registered bank account via **Razorpay Route** upon delivery confirmation. Make sure your bank payout account is linked in your workspace settings.`,
        suggestedRouteId: "tailor-settings",
        suggestedRouteLabel: "Manage Payout Settings",
      }
    }
  }

  if (query.includes("measure") || query.includes("size") || query.includes("fit")) {
    return {
      content: `Threadify allows you to maintain detailed body measurement profiles (chest, waist, hips, sleeve length, inseam) in your profile settings so tailors can craft a perfect bespoke fit.`,
      suggestedRouteId: "customer-settings",
      suggestedRouteLabel: "Manage Body Measurements",
    }
  }

  if (query.includes("portfolio") || query.includes("photo") || query.includes("work")) {
    if (context.role === "tailor") {
      return {
        content: `Showcase your craftsmanship by uploading high-resolution photos of past garments to your **Portfolio**. Profiles with 10+ photos receive 3x more bid acceptances!`,
        suggestedRouteId: "tailor-portfolio",
        suggestedRouteLabel: "Open Portfolio Showcase",
      }
    }
  }

  // 2. Knowledge Base match fallback
  if (relevantKnowledge.length > 0) {
    const topMatch = relevantKnowledge[0]
    let suggestedRouteId: string | undefined
    let suggestedRouteLabel: string | undefined

    if (topMatch.suggestedRouteId && isRouteAllowed(topMatch.suggestedRouteId, context.role)) {
      suggestedRouteId = topMatch.suggestedRouteId
      suggestedRouteLabel = ROUTE_WHITELIST[topMatch.suggestedRouteId]?.label
    }

    return {
      content: `${topMatch.content}\n\nIs there anything specific about this feature you would like to know?`,
      suggestedRouteId,
      suggestedRouteLabel,
    }
  }

  // 3. Generic fallback response
  const defaultRoute = allowedRoutes[0]
  return {
    content: `I'm **Threadify AI**, your personal assistant for Threadify. I can help you with custom design requests, tracking orders, understanding escrow payments, body measurements, and tailor portfolios.\n\nHow can I help you today?`,
    suggestedRouteId: defaultRoute?.id,
    suggestedRouteLabel: defaultRoute ? `Go to ${defaultRoute.label}` : undefined,
  }
}

/**
 * Returns role-aware suggestion quick chips
 */
export function getRoleSuggestions(role: Role): string[] {
  if (role === "customer") {
    return [
      "How do custom design requests work?",
      "How does payment escrow protect me?",
      "Where do I save body measurements?",
      "How do I choose the best tailor?",
    ]
  }

  if (role === "tailor") {
    return [
      "How do I submit price quotes to clients?",
      "When do I receive payment for orders?",
      "How can I improve my profile portfolio?",
      "How do I update production order milestones?",
    ]
  }

  return [
    "How do I verify pending tailor applications?",
    "How do I resolve customer disputes?",
    "Where can I view platform order stats?",
  ]
}
