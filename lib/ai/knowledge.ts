/**
 * Threadify AI Assistant — Platform Knowledge Base
 *
 * Structured knowledge content repository.
 * Keeps system prompt small & fast while providing accurate feature explanations.
 */

export interface KnowledgeTopic {
  id: string
  title: string
  roles: Array<"customer" | "tailor" | "admin">
  keywords: string[]
  content: string
  suggestedRouteId?: string
}

export const PLATFORM_KNOWLEDGE: KnowledgeTopic[] = [
  // ── Customer Knowledge ──────────────────────────────────────────────────────
  {
    id: "how-to-order",
    title: "How to Place a Custom Garment Order",
    roles: ["customer"],
    keywords: ["order", "design", "request", "custom", "stitch", "create", "start", "quote", "price"],
    suggestedRouteId: "design-studio",
    content: `
To place a custom order on Threadify:
1. Open the **Design Studio** and upload an inspiration photo, sketch, or reference image.
2. Specify your budget range, desired deadline, and any fabric or measurement preferences.
3. Submit your design request to the public marketplace.
4. Verified master tailors will review your request and submit price quotations.
5. Review tailor profiles, ratings, and quotes, then accept your preferred tailor's bid.
    `.trim(),
  },
  {
    id: "payments-escrow",
    title: "Payment Escrow & Protection",
    roles: ["customer"],
    keywords: ["payment", "pay", "escrow", "safe", "refund", "razorpay", "security", "charge"],
    suggestedRouteId: "customer-payments",
    content: `
Threadify uses a secure Escrow payment model powered by Razorpay:
- When you accept a tailor's price quote, your funds are held safely in escrow.
- The tailor begins crafting your garment once payment is authorized.
- Funds are only released to the tailor after you receive the garment and confirm delivery.
- If there is a major issue with fit or quality, you can open a dispute for admin review.
    `.trim(),
  },
  {
    id: "body-measurements",
    title: "Body Measurements & Fitting",
    roles: ["customer"],
    keywords: ["measurement", "size", "fit", "chest", "waist", "hips", "profile", "tailor fit"],
    suggestedRouteId: "customer-settings",
    content: `
You can save reusable body measurement profiles in your Account Settings:
- Enter standard measurements (chest, waist, hips, shoulder, sleeve length, inseam).
- You can also request doorstep measurement service if offered by your chosen tailor.
- Tailors refer to your saved measurement profile when drafting your custom garment.
    `.trim(),
  },
  {
    id: "explore-tailors",
    title: "Finding & Choosing a Tailor",
    roles: ["customer"],
    keywords: ["tailor", "find", "artist", "specialty", "rating", "review", "portfolio", "boutique"],
    suggestedRouteId: "explore-tailors",
    content: `
Finding the perfect tailor:
- Visit **Explore Tailors** to view verified craftsmen across India.
- Filter tailors by specialty (e.g. Bridal Wear, Ethnic Wear, Luxury Couture, Mens Suits).
- Review verified customer ratings, past work portfolio galleries, and response times.
- You can directly invite a tailor to bid on your design request.
    `.trim(),
  },

  // ── Tailor Knowledge ────────────────────────────────────────────────────────
  {
    id: "submitting-bids",
    title: "How to Submit Price Quotes & Bids",
    roles: ["tailor"],
    keywords: ["bid", "quote", "price", "proposal", "client", "request", "estimate"],
    suggestedRouteId: "tailor-requests",
    content: `
Submitting bids on Threadify:
1. Go to **Client Requests** in your Tailor Workspace.
2. Review open design requests, inspiration images, deadline, and customer budget.
3. Enter your price quote (in ₹ INR), estimated production days, and a personal note to the client.
4. Submit your quotation. The client will be notified immediately.
5. If the client accepts your quote, the order automatically moves to your Active Orders.
    `.trim(),
  },
  {
    id: "order-production-payouts",
    title: "Order Production Status & Payouts",
    roles: ["tailor"],
    keywords: ["payout", "bank", "money", "production", "status", "ship", "deliver", "razorpay route"],
    suggestedRouteId: "tailor-orders",
    content: `
Managing production and receiving payouts:
- Keep the client updated by advancing order status: Paid → In Production → Shipped → Delivered.
- Connect your bank account in **Workspace Settings** (Razorpay Route account).
- Once the customer confirms delivery (or 7 days after delivery status), your payout is automatically deposited into your registered bank account.
    `.trim(),
  },
  {
    id: "tailor-portfolio-tips",
    title: "Building a Standout Portfolio Profile",
    roles: ["tailor"],
    keywords: ["portfolio", "photos", "work", "showcase", "profile", "bio", "verification"],
    suggestedRouteId: "tailor-portfolio",
    content: `
Building a high-converting profile:
- Upload high-resolution photos of your completed garments in **Previous Work**.
- Highlight details like hand embroidery, stitching precision, and fabric finish.
- Tailors with at least 10 portfolio photos receive 3x more bid acceptances.
- Make sure your legal business info and verification credentials are updated in settings.
    `.trim(),
  },

  // ── General / Platform Knowledge ────────────────────────────────────────────
  {
    id: "disputes-support",
    title: "Customer Support & Disputes",
    roles: ["customer", "tailor"],
    keywords: ["dispute", "help", "support", "issue", "problem", "cancel", "complain"],
    suggestedRouteId: "customer-messages",
    content: `
Need help with an order?
- Try communicating directly with the client or tailor first via **Messages**.
- If an agreement cannot be reached regarding order quality or delays, open a Dispute.
- Threadify Admin will inspect chat history, order requirements, and photos to resolve the issue fairly.
    `.trim(),
  },
]

/**
 * Retrieves relevant knowledge topics based on user query and role
 */
export function getRelevantKnowledge(
  query: string,
  role: "customer" | "tailor" | "admin"
): KnowledgeTopic[] {
  const normalizedQuery = query.toLowerCase()
  const words = normalizedQuery.split(/\s+/)

  // Filter topics accessible to the role
  const roleTopics = PLATFORM_KNOWLEDGE.filter((topic) => topic.roles.includes(role))

  // Score each topic by keyword matches
  const scored = roleTopics.map((topic) => {
    let score = 0
    topic.keywords.forEach((keyword) => {
      if (normalizedQuery.includes(keyword)) score += 3
      words.forEach((word) => {
        if (word === keyword) score += 5
        else if (word.includes(keyword) || keyword.includes(word)) score += 1
      })
    })
    return { topic, score }
  })

  // Sort descending by score, return top matching topics (score > 0)
  const matches = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.topic)

  // If no match found, return default overview topics for that role
  if (matches.length === 0) {
    return roleTopics.slice(0, 2)
  }

  return matches.slice(0, 3)
}
