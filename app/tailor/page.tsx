"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  Bell,
  Clock,
  Package,
  FileText,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Scissors,
  Inbox
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatINR } from "@/lib/utils/currency"

interface TailorStats {
  openRequests: number
  pendingQuotes: number
  activeOrders: number
  unreadNotifications: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any

export default function TailorWorkspaceDashboard() {
  const supabase = createClient()
  const [userName, setUserName] = React.useState("Tailor")
  const [stats, setStats] = React.useState<TailorStats | null>(null)

  const [recentRequests, setRecentRequests] = React.useState<AnyRow[]>([])
  const [activeOrdersList, setActiveOrdersList] = React.useState<AnyRow[]>([])
  const [unreadNotifs, setUnreadNotifs] = React.useState<AnyRow[]>([])

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

        // 1. Stats
        // Open Requests
        const { count: openReqCount } = await supabase
          .from("design_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_bids")

        // Pending Quotes
        const { count: pendingQuotesCount } = await supabase
          .from("quotations")
          .select("id", { count: "exact", head: true })
          .eq("tailor_id", user.id)
          .eq("status", "pending")

        // Active Orders
        const { count: activeOrdersCount } = await supabase
          .from("design_requests")
          .select("id", { count: "exact", head: true })
          .eq("tailor_id", user.id)
          .in("status", ["paid", "in_production", "shipped"])

        // Unread Notifications
        const { count: unreadNotifCount } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false)

        setStats({
          openRequests: openReqCount ?? 0,
          pendingQuotes: pendingQuotesCount ?? 0,
          activeOrders: activeOrdersCount ?? 0,
          unreadNotifications: unreadNotifCount ?? 0,
        })

        // 2. Fetch preview data for sections

        // Opportunities: 3 recent open requests
        const { data: requests } = await supabase
          .from("design_requests")
          .select("id, image_url, ai_tags, budget_min, budget_max, deadline, created_at")
          .eq("status", "pending_bids")
          .order("created_at", { ascending: false })
          .limit(3)
        if (requests) setRecentRequests(requests)

        // Active Work: 3 recent active orders
        const { data: orders } = await supabase
          .from("design_requests")
          .select(`
            id,
            image_url,
            ai_tags,
            status,
            deadline,
            amount_paid,
            customer:users!customer_id (name)
          `)
          .eq("tailor_id", user.id)
          .in("status", ["paid", "in_production", "shipped"])
          .order("created_at", { ascending: false })
          .limit(3)
        if (orders) setActiveOrdersList(orders)

        // Attention Area: 3 recent unread notifications
        const { data: notifs } = await supabase
          .from("notifications")
          .select("id, message, link, created_at")
          .eq("user_id", user.id)
          .eq("read", false)
          .order("created_at", { ascending: false })
          .limit(3)
        if (notifs) setUnreadNotifs(notifs)

      } catch (err) {
        console.error("Dashboard error", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-12">
      {/* Welcome Hero Area */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Good morning, {isLoading ? "…" : userName}.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground uppercase tracking-widest font-semibold">
            Your Workroom At A Glance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link href="/tailor/orders">
            <Button variant="outline" className="h-12 px-6 rounded-none text-sm font-bold uppercase tracking-wider transition-all border-border">
              View Orders
            </Button>
          </Link>
          <Link href="/tailor/requests">
            <Button className="h-12 px-6 rounded-none bg-foreground text-background hover:bg-foreground/90 text-sm font-bold uppercase tracking-wider transition-all">
              Browse Requests
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <Skeleton className="w-full h-32 rounded-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Skeleton className="lg:col-span-5 h-80 rounded-none" />
            <Skeleton className="lg:col-span-7 h-80 rounded-none" />
          </div>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <MetricCard
              label="Open Requests"
              value={stats?.openRequests ?? 0}
              icon={<Inbox className="w-5 h-5 text-muted-foreground" />}
              href="/tailor/requests"
            />
            <MetricCard
              label="Pending Quotes"
              value={stats?.pendingQuotes ?? 0}
              icon={<FileText className="w-5 h-5 text-muted-foreground" />}
              href="/tailor/quotations"
            />
            <MetricCard
              label="Active Orders"
              value={stats?.activeOrders ?? 0}
              icon={<Scissors className="w-5 h-5 text-muted-foreground" />}
              href="/tailor/orders"
            />
            <MetricCard
              label="Unread Alerts"
              value={stats?.unreadNotifications ?? 0}
              icon={<Bell className="w-5 h-5 text-muted-foreground" />}
              href="/tailor/notifications"
              highlight={!!stats?.unreadNotifications && stats.unreadNotifications > 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Needs Attention */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Needs Attention
                </h2>
                <Link href="/tailor/notifications" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                  View All
                </Link>
              </div>

              {unreadNotifs.length > 0 ? (
                <div className="space-y-3">
                  {unreadNotifs.map((notif) => (
                    <Link key={notif.id} href={notif.link || "/tailor"} className="block p-4 border border-border/40 hover:border-primary/40 bg-card transition-all group">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-2 block uppercase tracking-wider font-semibold">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 border border-border/40 border-dashed text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">You&apos;re all caught up.</p>
                  <p className="text-xs text-muted-foreground">No pending notifications require your attention.</p>
                </div>
              )}
            </div>

            {/* Opportunities */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h2 className="font-serif text-xl font-bold">Opportunities</h2>
                <Link href="/tailor/requests" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                  View Market
                </Link>
              </div>

              {recentRequests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {recentRequests.map((req) => (
                    <Link key={req.id} href={`/tailor/requests/${req.id}`} className="block border border-border/40 hover:border-primary/40 bg-card overflow-hidden group">
                      <div className="aspect-square relative bg-muted border-b border-border/40">
                        <Image
                          src={req.image_url}
                          alt="Design request"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider truncate">
                          {req.ai_tags?.[0] || "Custom Design"}
                        </h3>
                        <p className="text-sm text-foreground font-semibold">
                          {formatINR(req.budget_min)} - {formatINR(req.budget_max)}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due {req.deadline ? new Date(req.deadline).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-border/40 border-dashed text-center">
                  <p className="text-sm text-muted-foreground">New customer opportunities will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Work */}
          <div className="pt-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-6">
              <h2 className="font-serif text-2xl font-bold">Active Work</h2>
              <Link href="/tailor/orders" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                View Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeOrdersList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOrdersList.map((order) => (
                  <Link key={order.id} href="/tailor/orders" className="flex flex-col gap-4 p-4 border border-border/40 hover:border-primary/40 transition-all bg-card group">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 shrink-0 relative bg-muted border border-border/40">
                        <Image src={order.image_url} alt="Order garment" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-foreground truncate">{order.customer?.name || "Customer"}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.ai_tags?.[0]}</p>
                        <div className="mt-2">
                          <span className="text-xs font-bold">{formatINR(order.amount_paid || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider border border-primary/20">
                        {order.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due {order.deadline}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-border/40 border-dashed text-center">
                <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-foreground font-semibold">No active orders right now.</p>
                <p className="text-xs text-muted-foreground mt-1">Submit quotes to win new commissions.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  href,
  highlight = false
}: {
  label: string,
  value: number,
  icon: React.ReactNode,
  href: string,
  highlight?: boolean
}) {
  return (
    <Link href={href} className="group flex flex-col justify-between p-5 border border-border/40 bg-card hover:border-primary/40 transition-all h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-none border ${highlight ? 'border-amber-500/50 bg-amber-500/10' : 'border-border bg-muted/50'} group-hover:bg-primary/5 transition-colors`}>
          {icon}
        </div>
        <span className="text-2xl lg:text-3xl font-serif font-bold text-foreground">{value}</span>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2">
        <h4 className="font-bold text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{label}</h4>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
      </div>
    </Link>
  )
}
