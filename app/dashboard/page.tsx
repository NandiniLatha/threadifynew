"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Scissors,
  Package,
  Clock,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Star,
  Ruler,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  activeOrders:    number
  pendingRequests: number
  pendingQuotes:   number
  unreadMessages:  number
}

export default function CustomerDashboardOverview() {
  const supabase = createClient()
  const [userName,  setUserName]  = React.useState("there")
  const [stats,     setStats]     = React.useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch name
        const { data: profile } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single()
        if (profile?.name) setUserName(profile.name.split(" ")[0])

        // Fetch all design_requests for this customer
        const { data: requests } = await supabase
          .from("design_requests")
          .select("id, status")
          .eq("customer_id", user.id)

        const allReqs = requests ?? []

        // Active Orders: paid and beyond
        const activeStatuses = [
          "paid", "confirmed", "measurements_pending", "in_production", 
          "cutting", "stitching", "quality_check", "ready", 
          "shipped", "delivered", "completed", "reviewed"
        ]
        const activeOrders = allReqs.filter(r => activeStatuses.includes(r.status)).length

        // Pending Requests: awaiting quotes or awaiting customer review (pending_bids, assigned, quoted)
        const pendingStatuses = ["pending_bids", "assigned", "quoted"]
        const pendingReqs = allReqs.filter(r => pendingStatuses.includes(r.status)).length

        // Quotes to Review: count of pending quotations submitted by tailors on user's design requests
        const reqIds = allReqs.map(r => r.id)
        let pendingQuotesCount = 0
        if (reqIds.length > 0) {
          const { count } = await supabase
            .from("quotations")
            .select("id", { count: "exact", head: true })
            .in("request_id", reqIds)
            .eq("status", "pending")
          pendingQuotesCount = count ?? 0
        }

        // Unread messages count for this specific customer
        const { data: userConvs } = await supabase
          .from("conversations")
          .select("customer_unread")
          .eq("customer_id", user.id)

        const unreadCount = userConvs
          ? userConvs.reduce((acc, c) => acc + (c.customer_unread || 0), 0)
          : 0

        setStats({
          activeOrders,
          pendingRequests: pendingReqs,
          pendingQuotes:   pendingQuotesCount,
          unreadMessages:  unreadCount,
        })
      } catch {
        setStats({ activeOrders: 0, pendingRequests: 0, pendingQuotes: 0, unreadMessages: 0 })
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboard()

    // Listen for custom read events dispatched when chat is opened
    const handleMessagesRead = () => {
      loadDashboard()
    }
    window.addEventListener("messages-read", handleMessagesRead)

    return () => {
      window.removeEventListener("messages-read", handleMessagesRead)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-12 pb-16">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-border/20">
        <div className="space-y-3">
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold tracking-normal text-foreground">
            Welcome back, {isLoading ? "…" : <span className="text-primary">{userName}</span>}.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground uppercase tracking-wider font-medium">
            Your Bespoke Wardrobe Tailor Shop
          </p>
        </div>
        <Link href="/design-studio" className="shrink-0">
          <Button className="h-12 px-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg text-sm font-semibold uppercase tracking-wider transition-all transform hover:-translate-y-0.5">
            NEW DESIGN REQUEST
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-80 rounded-3xl" />
          <Skeleton className="lg:col-span-4 h-80 rounded-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Editorial Block - Active Orders */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-serif text-2xl font-semibold text-foreground/90">In Progress</h2>
              <Link href="/dashboard/orders" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                View All Orders <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            <Link 
              href="/dashboard/orders"
              className="group relative h-80 w-full bg-card rounded-3xl flex flex-col justify-end p-8 border border-border/30 shadow-sm transition-all hover:shadow-md hover:border-primary/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent z-10" />
              
              <div className="relative z-20 space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {stats?.activeOrders === 1 ? "1 Active Commission" : `${stats?.activeOrders || 0} Active Commissions`}
                </div>
                <h3 className="font-serif text-3xl font-medium text-foreground leading-tight">
                  Track the cutting and stitching of your latest bespoke garments.
                </h3>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors pt-4">
                  <Package className="w-4 h-4" />
                  <span>Check production status</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-8 right-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
              <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
            </Link>
          </div>

          {/* Side Editorial Block - Pending Actions */}
          <div className="lg:col-span-4 flex flex-col gap-5">
             <div className="flex items-center justify-between px-1">
               <h2 className="font-serif text-2xl font-semibold text-foreground/90">Action Required</h2>
             </div>
             
             <div className="flex-1 flex flex-col gap-4">
                <Link 
                  href="/dashboard/requests" 
                  className="flex-1 bg-card rounded-2xl flex flex-col justify-center p-6 border border-border/30 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Star className="w-24 h-24 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Star className="w-5 h-5" />
                      </div>
                      <span className="text-4xl font-serif font-medium text-foreground/90">{stats?.pendingQuotes || 0}</span>
                    </div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">Quotes to Review</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[80%]">Tailors have submitted proposals for your requests.</p>
                  </div>
                </Link>

                <Link 
                  href="/dashboard/messages" 
                  className="flex-1 bg-card rounded-2xl flex flex-col justify-center p-6 border border-border/30 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <MessageSquare className="w-24 h-24 text-blue-600" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="text-4xl font-serif font-medium text-foreground/90">{stats?.unreadMessages || 0}</span>
                    </div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">Unread Messages</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[80%]">Updates and questions from your tailors.</p>
                  </div>
                </Link>
             </div>
          </div>

        </div>
      )}

      {/* Secondary Actions Row */}
      <div className="pt-10">
        <div className="flex items-center justify-between mb-8 px-1">
           <h2 className="font-serif text-2xl font-semibold text-foreground/90">Studio Tools</h2>
           <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Explore Capabilities</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/design-studio" className="group flex flex-col bg-card rounded-3xl p-8 border border-border/30 shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
             <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-primary/20 transition-all">
               <Sparkles className="w-6 h-6 text-primary" />
             </div>
             <div>
               <h3 className="font-semibold text-xl mb-3 text-foreground">Design Studio</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Upload inspiration photos for automatic vision analysis and instant AI-driven price estimates. Bring your ideas to life.
               </p>
             </div>
             <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
               <span>Start Designing</span>
               <ChevronRight className="w-4 h-4" />
             </div>
          </Link>

          <Link href="/dashboard/measurements" className="group flex flex-col bg-card rounded-3xl p-8 border border-border/30 shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
             <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-amber-500/20 transition-all">
               <Ruler className="w-6 h-6 text-amber-600" />
             </div>
             <div>
               <h3 className="font-semibold text-xl mb-3 text-foreground">Body Profiles</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Store and update your precise measurement profiles to ensure an exact bespoke fit for every order, effortlessly.
               </p>
             </div>
             <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-amber-600 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
               <span>Manage Measurements</span>
               <ChevronRight className="w-4 h-4" />
             </div>
          </Link>

          {/* Additional Tool Card to fill the empty space */}
          <Link href="/dashboard/wishlist" className="group flex flex-col bg-card rounded-3xl p-8 border border-border/30 shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
             <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all">
               <Scissors className="w-6 h-6 text-emerald-600" />
             </div>
             <div>
               <h3 className="font-semibold text-xl mb-3 text-foreground">Style Wishlist</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Save and organize your favorite tailor portfolios, fabrics, and styles for your next bespoke commission.
               </p>
             </div>
             <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-600 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
               <span>View Wishlist</span>
               <ChevronRight className="w-4 h-4" />
             </div>
          </Link>

        </div>
      </div>
    </div>
  )
}