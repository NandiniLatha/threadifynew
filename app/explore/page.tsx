import React from "react"
import { createClient } from "@/lib/supabase/server"
import { getTailorConfig } from "@/lib/data/tailor-config"
import { getFashionPortfolioImages } from "@/lib/data/fashion-images"
import ExploreClient from "./ExploreClient"
import Link from "next/link"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"

// Revalidate every 60 seconds so the explorer stays fresh without forcing
// a full server render on every request.
export const revalidate = 60


export default async function ExplorePage() {
  const supabase = createClient()

  // ── 1. Parallelise all independent queries ──────────────────────────────
  const [
    { data: { user } },
    { data: tailorsData },
    { data: quotationsData },
    { data: recentRequests },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("tailor_profiles")
      .select(`
        user_id,
        bio,
        avg_rating,
        verification_status,
        created_at,
        portfolio_images,
        user:users!user_id (name)
      `)
      .eq("verification_status", "approved")
      .limit(50),
    supabase
      .from("quotations")
      .select("tailor_id, status, request:design_requests!request_id (status)")
      .eq("status", "accepted"),
    supabase
      .from("design_requests")
      .select("id, created_at, status, quotations!inner (tailor_id, status)")
      .eq("quotations.status", "accepted")
      .not("status", "in", '("draft", "pending_bids", "cancelled")')
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  // ── 2. Fetch saved tailors (depends on user) ────────────────────────────
  let savedTailorIds: string[] = []
  if (user) {
    const { data: savedData } = await supabase
      .from("saved_tailors")
      .select("tailor_id")
      .eq("customer_id", user.id)

    if (savedData) {
      savedTailorIds = savedData.map((s) => s.tailor_id)
    }
  }

  // ── 4. Completed orders count map ──────────────────────────────────────
  const ordersCompletedMap: Record<string, number> = {}
  if (quotationsData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quotationsData.forEach((q: any) => {
      const reqStatus = q.request?.status
      if (reqStatus && !["draft", "pending_bids", "cancelled"].includes(reqStatus)) {
        ordersCompletedMap[q.tailor_id] = (ordersCompletedMap[q.tailor_id] || 0) + 1
      }
    })
  }

  // ── 5. Map tailors with config and placeholders ────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedTailors = (tailorsData || []).map((t: any) => {
    // Generate config placeholders based on bio/specialty
    const config = getTailorConfig(t.user_id, t.user?.name || t.bio)
    
    return {
      id: t.user_id,
      name: t.user?.name || "Independent Designer",
      isVerified: t.verification_status === "approved",
      rating: parseFloat(t.avg_rating) || 5.0,
      ordersCompleted: ordersCompletedMap[t.user_id] || 0,
      config,
      saved: savedTailorIds.includes(t.user_id),
      createdAt: t.created_at,
      // Use real portfolio images from DB when available, otherwise
      // derive category-appropriate fashion images from the library
      images: (t.portfolio_images && t.portfolio_images.length > 0)
        ? t.portfolio_images
        : getFashionPortfolioImages(config.category, 5, Math.abs(t.user_id.charCodeAt(0) - 97))
    }
  })

  // ── 6. Recently booked IDs ────────────────────────────────────────────────
  const recentlyBookedIds = Array.from(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new Set((recentRequests || []).map((r: any) => r.quotations[0]?.tailor_id))
  ).filter(Boolean) as string[]

  const recentlyBooked = recentlyBookedIds
    .map((id) => mappedTailors.find((t) => t.id === id))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(Boolean) as any[]

  return (
    <div className="relative min-h-screen bg-transparent selection:bg-primary/20 selection:text-primary font-sans transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/40 transition-colors">
        <div className="container mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-serif text-3xl font-black tracking-tighter text-foreground">
              Threadify
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/explore" className="text-sm font-semibold text-foreground border-b-2 border-primary pb-1">
              Explore
            </Link>
            <Link href="/design-studio" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Studio
            </Link>
            <Link href="/inspiration" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Inspiration
            </Link>
            <Link href="/about" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {!user ? (
              <>
                <Button asChild variant="ghost" className="rounded-full h-10 px-6 font-semibold">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="rounded-full h-10 px-6 font-semibold shadow-md">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            ) : (
              <Button asChild className="rounded-full h-10 px-6 font-semibold shadow-md">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <ExploreClient initialTailors={mappedTailors} recentlyBooked={recentlyBooked} />
      </main>
    </div>
  )
}
