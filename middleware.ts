import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// ── 1. Configuration ────────────────────────────────────────────────────────
// Define protected route prefixes and their required roles
const ROUTE_CONFIG = {
  customer: ["/dashboard"],
  tailor:   ["/tailor"],
  admin:    ["/admin"]
} as const

// Public routes that don't require verification even if logged in
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/explore", "/inspiration", "/about", "/verify-email"]

// ── 2. Middleware ───────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // IMPORTANT: always call getUser() to refresh the session token
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ── 3. Route Matching ─────────────────────────────────────────────────────
  
  // Is this route protected?
  const isDashboardRoute = pathname.startsWith(ROUTE_CONFIG.customer[0])
  const isTailorRoute    = pathname.startsWith(ROUTE_CONFIG.tailor[0])
  const isAdminRoute     = pathname.startsWith(ROUTE_CONFIG.admin[0])
  
  // Exception: Tailor public profile (e.g. /tailor/[uuid]) is public
  const isTailorPublicProfile = /^\/tailor\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)
  
  const isProtectedRoute = (isDashboardRoute || (isTailorRoute && !isTailorPublicProfile) || isAdminRoute)
  const isAuthRoute      = pathname === "/login" || pathname === "/signup"

  // ── 4. Authentication Guard ───────────────────────────────────────────────
  
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // ── 5. Email Verification Guard ───────────────────────────────────────────
  
  // If they are logged in but haven't confirmed their email, block access to protected routes
  if (user && isProtectedRoute) {
    // If email_confirmed_at is missing (and they signed up with email), they are unverified
    const isVerified = !!user.email_confirmed_at
    if (!isVerified) {
      const url = request.nextUrl.clone()
      url.pathname = "/verify-email"
      return NextResponse.redirect(url)
    }
  }

  // ── 6. Role Lookup (single fetch, reused for both guards below) ───────────
  //
  // Only needed when the user is authenticated AND is on a protected or auth route.
  // We perform ONE lookup here and branch on it, eliminating the duplicate fetch
  // that previously existed at line 117 (auth-route redirect guard).

  let role: string | undefined
  if (user && (isProtectedRoute || isAuthRoute)) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
    role = profile?.role
  }

  // ── 7. Authorization Guard (protected routes) ─────────────────────────────
  
  if (isProtectedRoute && user) {
    // Race condition mitigation: if profile not created yet, allow through for client side to handle,
    // or just redirect to a loading/setup page. We'll let it pass to avoid infinite redirect loops, 
    // the layout guards will catch it if needed.
    if (!role) return response

    // Route Enforcement
    if (isDashboardRoute && role !== "customer") {
      const url = request.nextUrl.clone()
      url.pathname = role === "tailor" ? "/tailor/requests" : role === "admin" ? "/admin" : "/login"
      return NextResponse.redirect(url)
    }

    if (isTailorRoute && !isTailorPublicProfile && role !== "tailor") {
      const url = request.nextUrl.clone()
      url.pathname = role === "admin" ? "/admin" : "/dashboard"
      return NextResponse.redirect(url)
    }

    if (isAdminRoute && role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = role === "tailor" ? "/tailor/requests" : "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // ── 8. Redirect authenticated users away from auth pages ──────────────────
  
  if (user && isAuthRoute) {
    // role was already fetched above — reuse it, no second DB call
    if (role) {
      const url = request.nextUrl.clone()
      url.pathname = role === "tailor" ? "/tailor/requests" : role === "admin" ? "/admin" : "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
