/**
 * Threadify AI Assistant — Route Whitelist
 *
 * Strict, hardcoded whitelist of allowed internal navigation routes.
 * The AI assistant can ONLY navigate to routes defined in this registry.
 * This prevents navigation prompt-injection vulnerabilities.
 */

export interface WhitelistRoute {
  id: string
  path: string
  label: string
  roles: Array<"customer" | "tailor" | "admin">
  description: string
  category: "dashboard" | "orders" | "messages" | "account" | "explore" | "admin"
}

export const ROUTE_WHITELIST: Record<string, WhitelistRoute> = {
  // ── Customer Routes ─────────────────────────────────────────────────────────
  "customer-overview": {
    id: "customer-overview",
    path: "/dashboard",
    label: "Dashboard Overview",
    roles: ["customer"],
    description: "Main workspace summary, active orders overview, and quick shortcuts",
    category: "dashboard",
  },
  "customer-requests": {
    id: "customer-requests",
    path: "/dashboard/requests",
    label: "My Custom Requests",
    roles: ["customer"],
    description: "View and track custom garment design requests submitted for bids",
    category: "orders",
  },
  "customer-orders": {
    id: "customer-orders",
    path: "/dashboard/orders",
    label: "My Orders",
    roles: ["customer"],
    description: "Track garments currently in production, shipping, or delivered",
    category: "orders",
  },
  "customer-messages": {
    id: "customer-messages",
    path: "/dashboard/messages",
    label: "Messages Inbox",
    roles: ["customer"],
    description: "Chat threads with assigned tailors for active requests & orders",
    category: "messages",
  },
  "customer-notifications": {
    id: "customer-notifications",
    path: "/dashboard/notifications",
    label: "Notifications",
    roles: ["customer"],
    description: "System updates, bid notifications, and order milestone alerts",
    category: "account",
  },
  "customer-wishlist": {
    id: "customer-wishlist",
    path: "/dashboard/wishlist",
    label: "Wishlist & Saved Designs",
    roles: ["customer"],
    description: "Saved tailor profiles and bookmarked garment inspirations",
    category: "account",
  },
  "customer-payments": {
    id: "customer-payments",
    path: "/dashboard/payments",
    label: "Payments & Escrow",
    roles: ["customer"],
    description: "Transaction history, milestone escrow status, and payment receipts",
    category: "account",
  },
  "customer-settings": {
    id: "customer-settings",
    path: "/dashboard/settings",
    label: "Account & Body Measurements",
    roles: ["customer"],
    description: "Manage personal profile, shipping addresses, and saved body measurements",
    category: "account",
  },
  "design-studio": {
    id: "design-studio",
    path: "/design-studio",
    label: "Start Custom Order (Design Studio)",
    roles: ["customer"],
    description: "Upload an inspiration photo or sketch to create a new tailor request",
    category: "explore",
  },
  "explore-tailors": {
    id: "explore-tailors",
    path: "/explore",
    label: "Explore Master Tailors",
    roles: ["customer"],
    description: "Browse verified custom tailors by specialty, rating, and location",
    category: "explore",
  },

  // ── Tailor Routes ───────────────────────────────────────────────────────────
  "tailor-requests": {
    id: "tailor-requests",
    path: "/tailor/requests",
    label: "Client Requests (Bidding Marketplace)",
    roles: ["tailor"],
    description: "Browse client design requests looking for price quotes",
    category: "orders",
  },
  "tailor-quotations": {
    id: "tailor-quotations",
    path: "/tailor/quotations",
    label: "My Price Quotes",
    roles: ["tailor"],
    description: "View and manage submitted price quotes and bid statuses",
    category: "orders",
  },
  "tailor-orders": {
    id: "tailor-orders",
    path: "/tailor/orders",
    label: "Active Production Orders",
    roles: ["tailor"],
    description: "Manage customer garments currently in production or ready for shipping",
    category: "orders",
  },
  "tailor-portfolio": {
    id: "tailor-portfolio",
    path: "/tailor/portfolio",
    label: "Portfolio Showcase",
    roles: ["tailor"],
    description: "Manage previous work showcase photos displayed on your public profile",
    category: "account",
  },
  "tailor-messages": {
    id: "tailor-messages",
    path: "/tailor/messages",
    label: "Client Messages Inbox",
    roles: ["tailor"],
    description: "Direct messaging thread with clients for orders and quotes",
    category: "messages",
  },
  "tailor-settings": {
    id: "tailor-settings",
    path: "/tailor/settings",
    label: "Workspace & Payout Settings",
    roles: ["tailor"],
    description: "Configure Razorpay payout bank account, boutique info, and services",
    category: "account",
  },

  // ── Admin Routes ────────────────────────────────────────────────────────────
  "admin-verification": {
    id: "admin-verification",
    path: "/admin/tailor-verification",
    label: "Tailor Verification Curation Queue",
    roles: ["admin"],
    description: "Review and approve/reject pending tailor registration applications",
    category: "admin",
  },
  "admin-orders": {
    id: "admin-orders",
    path: "/admin/orders",
    label: "Platform Orders Management",
    roles: ["admin"],
    description: "Monitor all customer and tailor orders across the platform",
    category: "admin",
  },
  "admin-disputes": {
    id: "admin-disputes",
    path: "/admin/disputes",
    label: "Disputes Resolution Board",
    roles: ["admin"],
    description: "Review customer/tailor disputes and manage escrow holds",
    category: "admin",
  },
}

/**
 * Returns allowed routes for a given role
 */
export function getRoutesForRole(role: "customer" | "tailor" | "admin"): WhitelistRoute[] {
  return Object.values(ROUTE_WHITELIST).filter((route) => route.roles.includes(role))
}

/**
 * Validates whether a route ID exists and is authorized for a role
 */
export function isRouteAllowed(routeId: string, role: "customer" | "tailor" | "admin"): boolean {
  const route = ROUTE_WHITELIST[routeId]
  if (!route) return false
  return route.roles.includes(role)
}
