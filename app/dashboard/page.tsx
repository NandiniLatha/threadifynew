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

        // Active Orders: assigned (quote accepted), paid, in production, or shipped
        const activeStatuses = ["assigned", "paid", "in_production", "shipped"]
        const activeOrders = allReqs.filter(r => activeStatuses.includes(r.status)).length

        // Pending Requests: awaiting initial quotes from tailors
        const pendingReqs = allReqs.filter(r => r.status === "pending_bids").length

        // Quotes to Review: count of pending quotations submitted by tailors on user's design requests
        const reqIds = allReqs.map(r => r.id)
        let pendingQuotesCount = 0
        if (reqIds.length > 0) {
          const { count } = await supabase
            .from("quotations")
            .select("id", { count: "exact", head: true })
            .in("request_id", reqIds)
            .eq("bid_status", "pending")
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statCards = [
    {
      label:    "Active Orders",
      value:    stats?.activeOrders ?? 0,
      href:     "/dashboard/orders",
      icon:     Package,
      color:    "text-primary",
      bg:       "bg-primary/10",
      cta:      "View Orders",
    },
    {
      label:    "Pending Requests",
      value:    stats?.pendingRequests ?? 0,
      href:     "/dashboard/requests",
      icon:     Clock,
      color:    "text-amber-600",
      bg:       "bg-amber-500/10",
      cta:      "View Requests",
    },
    {
      label:    "Quotes to Review",
      value:    stats?.pendingQuotes ?? 0,
      href:     "/dashboard/orders",
      icon:     Star,
      color:    "text-emerald-600",
      bg:       "bg-emerald-500/10",
      cta:      "Review Quotes",
    },
    {
      label:    "Unread Messages",
      value:    stats?.unreadMessages ?? 0,
      href:     "/dashboard/messages",
      icon:     MessageSquare,
      color:    "text-blue-600",
      bg:       "bg-blue-500/10",
      cta:      "Open Messages",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {isLoading ? "…" : userName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your bespoke wardrobe atelier — manage active commissions, quotes, and measurements.
          </p>
        </div>
        <Link href="/design-studio">
          <Button className="h-11 px-5 text-sm font-semibold flex items-center gap-2 shadow-sm">
            <Sparkles className="w-4 h-4" />
            New Design Request
          </Button>
        </Link>
      </div>

      {/* Live stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.label}
                href={card.href}
                className="group p-5 bg-card border border-border rounded-2xl shadow-sm hover:shadow hover:border-primary/30 transition-all flex flex-col gap-3"
              >
                <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{card.label}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${card.color} group-hover:underline`}>
                  {card.cta} <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Quick action cards */}
      <div>
        <h2 className="font-serif text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Design Studio */}
          <div className="p-6 bg-card border border-primary/20 rounded-2xl shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Design Studio</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Upload inspiration photos for automatic vision analysis and price estimates.
              </p>
            </div>
            <Link href="/design-studio" className="block pt-1">
              <Button size="sm" className="w-full text-xs font-semibold">
                Open Studio
              </Button>
            </Link>
          </div>

          {/* My Requests */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Scissors className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">My Requests</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Review tailor quotations and accept proposals for production.
              </p>
            </div>
            <Link href="/dashboard/requests" className="block pt-1">
              <Button size="sm" variant="outline" className="w-full text-xs font-semibold">
                View Requests
              </Button>
            </Link>
          </div>

          {/* Measurements */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Ruler className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Body Measurements</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Store your measurement profiles so tailors can ensure an exact bespoke fit.
              </p>
            </div>
            <Link href="/dashboard/measurements" className="block pt-1">
              <Button size="sm" variant="outline" className="w-full text-xs font-semibold">
                Manage Measurements
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
